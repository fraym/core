<?php
/**
 * @link      http://fraym.org
 * @author    Dominik Weber <info@fraym.org>
 * @copyright Dominik Weber <info@fraym.org>
 * @license   http://www.opensource.org/licenses/gpl-license.php GNU General Public License, version 2 or later (see the LICENSE file)
 */
namespace Fraym\Install;

use Fraym\Annotation\Registry;

/**
 * Class InstallController
 * @package Fraym\Install
 * @Registry(file="Register.php")
 * @Injectable(lazy=true)
 */
class InstallController extends \Fraym\Core
{
    /**
     * @Inject
     * @var \Fraym\Mail\Mail
     */
    protected $mail;

    /**
     * @Inject
     * @var \Fraym\ServiceLocator\ServiceLocator
     */
    protected $serviceLocator;

    /**
     * @Inject
     * @var \Fraym\Database\Database
     */
    protected $db;

    /**
     * @Inject
     * @var \Fraym\Registry\RegistryManager
     */
    protected $registry;

    /**
     * @Inject
     * @var \Fraym\Translation\Translation
     */
    protected $translation;

    /**
     * @Inject
     * @var \Fraym\Registry\Config
     */
    protected $config;

    /**
     * @Inject
     * @var \Fraym\Locale\Locale
     */
    protected $locale;

    /**
     * @Inject
     * @var \Fraym\User\User
     */
    protected $user;

    /**
     * @var string
     */
    protected $_configFile = 'Config.php';

    public function setup()
    {
        if (is_file($this->_configFile) && filesize($this->_configFile) > 0) {
            $this->response->sendHTTPStatusCode(404)->send('Fraym is already installed! Delete Config.php to reinstall.');
        }

        $apacheModules = null;
        $openBasedir = ini_get('open_basedir');
        $apcEnabled = (extension_loaded('apc') || extension_loaded('apcu')) && ini_get('apc.enabled');
        $opcacheEnabled = ini_get('opcache.enable');
        $opcacheCommentsEnabled = ini_get('opcache.load_comments') === false || ini_get('opcache.load_comments') == '1' ? true : false;

        if(function_exists('apache_get_modules')) {
            $apacheModules = apache_get_modules();
        }

        $this->view->assign('phpVersion', phpversion());
        $this->view->assign('openBasedir', $openBasedir);
        $this->view->assign('apcEnabled', $apcEnabled);
        $this->view->assign('opcacheEnabled', $opcacheEnabled);
        $this->view->assign('opcacheCommentsEnabled', $opcacheCommentsEnabled);
        $this->view->assign('apacheModules', $apacheModules);
        $this->view->assign('timezones', $this->getTimezones());
        $this->view->assign('done', false);
        $this->view->assign('error', false);
        $this->view->assign('post', $this->request->getGPAsObject());

        if ($this->request->isPost()) {
            $cmd = $this->request->post('cmd');
            if ($cmd === 'checkDatabase') {
                $this->checkDatabase();
            } elseif ($result = $this->install()) {
                $this->view->assign('done', true);
            }
        }

        $this->view->setTemplate('Install')->render();
    }

    protected function checkDatabase()
    {
        $post = $this->request->getGPAsObject();
        define('FRAYM_INSTANCE', time());
        define('DB_HOST', $post->database->host);
        define('DB_USER', $post->database->user);
        define('DB_PASS', $post->database->password);
        define('DB_DRIVER', $post->database->type);
        define('DB_CHARSET', 'UTF8');
        define('DB_PORT', $post->database->port);
        define('DB_NAME', $post->database->name);
        define('DB_TABLE_PREFIX', $post->database->prefix);

        $this->serviceLocator->set(
            'db.options',
            [
                'driver' => DB_DRIVER,
                'user' => DB_USER,
                'password' => DB_PASS,
                'host' => DB_HOST,
                'dbname' => DB_NAME,
                'charset' => DB_CHARSET
            ]
        );

        try {
            $this->db->connect()->getEntityManager()->getConnection()->connect();
        } catch (\Exception $e) {
            $this->response->sendAsJson(['error' => $e->getMessage()]);
        }

        $this->response->sendAsJson();
    }

    /**
     * @return mixed
     */
    public function getTimezones()
    {
        return \DateTimeZone::listIdentifiers(\DateTimeZone::ALL);
    }

    /**
     * @return bool
     */
    protected function install()
    {
        if ($this->writeConfig($this->_configFile)) {
            // Disable max script exec time, because creating database shema takes some time
            set_time_limit(0);
            include_once($this->_configFile);

            $this->serviceLocator->set(
                'db.options',
                [
                    'driver' => DB_DRIVER,
                    'user' => DB_USER,
                    'password' => DB_PASS,
                    'host' => DB_HOST,
                    'dbname' => DB_NAME,
                    'charset' => DB_CHARSET
                ]
            );

            $this->cache->clearAll();

            $this->db->connect()->getSchemaTool()->dropDatabase();

            $this->db->createSchema();
            
            if (($errors = $this->initConfigurations()) !== true) {
                unlink($this->_configFile);
                $this->view->assign('error', implode('<br />', $errors));
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * @return array|bool
     */
    protected function initConfigurations()
    {

        $gp = $this->request->getGPAsObject();
        $errors = [];

        /**
         * create default language
         */
        $locale = new \Fraym\Locale\Entity\Locale();
        switch ($gp->locale) {
            case 'german':
                $locale->name = 'German';
                $locale->locale = 'de_DE';
                $locale->country = 'Germany';
                $locale->default = true;
                break;
            case 'french':
                $locale->name = 'French';
                $locale->locale = 'fr_FR';
                $locale->country = 'France';
                $locale->default = true;
                break;
            case 'swedish':
                $locale->name = 'swedish';
                $locale->locale = 'sv_SE';
                $locale->country = 'Sweden';
                $locale->default = true;
                break;
            case 'spanish':
                $locale->name = 'Spanish';
                $locale->locale = 'es_ES';
                $locale->country = 'Spain';
                $locale->default = true;
                break;
            default: // english
                $locale->name = 'English';
                $locale->locale = 'en_US';
                $locale->country = 'USA';
                $locale->default = true;
                break;
        }
        $this->db->persist($locale);
        $this->db->flush();

        $this->locale->setLocale($locale);
        $this->db->setUpTranslateable()->setUpSortable();

        /**
         * create site
         */
        $site = new \Fraym\Site\Entity\Site();
        $site->name = $gp->site->name;
        $site->caching = true;
        $site->active = true;
        $site->menuItems->clear();
        $this->db->persist($site);

        /**
         * create domain for site
         */
        $domain = new \Fraym\Site\Entity\Domain();
        $domain->site = $site;
        $domain->address = $gp->site->url;
        $this->db->persist($domain);

        $this->addMenuItems($site);

        $adminGroup = new \Fraym\User\Entity\Group();
        $adminGroup->name = $this->translation->autoTranslation('Administrator', 'en', $this->locale->getLocale()->locale);
        $adminGroup->identifier = 'Administrator';
        $this->db->persist($adminGroup);

        $adminUser = new \Fraym\User\Entity\User();
        $adminUser->updateEntity($gp->user, false);

        if (strlen($gp->user->password) < 8) {
            $errors[] = 'Password is too short.';
        } elseif ($gp->user->password === $gp->user->password_repeat) {
            $adminUser->password = $gp->user->password;
        } else {
            $errors[] = 'Passwords do not match.';
        }

        $adminUser->groups->add($adminGroup);

        $this->db->persist($adminUser);

        if (count($errors) === 0) {

            $this->db->flush();
            $this->db->clear();

            /**
             * Register extensions, default theme...
             */
            $this->registry->registerExtensions();

            /**
             * Set menuitem template -> default theme
             */
            $this->setupMenuItemTemplate();

            /**
             * Login admin user
             */
            $this->user->setUserId($adminUser->id);
            return true;
        }

        return $errors;
    }

    /**
     * @return $this
     * @throws \Exception
     */
    protected function setupMenuItemTemplate()
    {
        /**
         * set default layout template
         */
        $tpl = $this->db->getRepository('\Fraym\Template\Entity\Template')->findOneById(1);
        if (!$tpl) {
            throw new \Exception('No default theme found! Please add a theme extension.');
        }

        $menuItems = $this->db->getRepository('\Fraym\Menu\Entity\MenuItem')->findAll();
        foreach ($menuItems as $menuItem) {
            $menuItem->template = $tpl;
        }
        return $this;
    }

    /**
     * @param $site
     * @return $this
     */
    protected function addMenuItems($site)
    {
        $pageRoot = $this->db->getRepository('\Fraym\Menu\Entity\MenuItem')->findOneById(1);

        /**
         * 404 Page
         */
        $newPage = new \Fraym\Menu\Entity\MenuItem();
        $newPage->site = $site;
        $newPage->caching = true;
        $newPage->https = false;
        $newPage->checkPermission = false;
        $newPage->is404 = true;
        $newPage->parent = $pageRoot;

        $newPageTranslation = new \Fraym\Menu\Entity\MenuItemTranslation();
        $newPageTranslation->menuItem = $newPage;
        $newPageTranslation->visible = false;
        $newPageTranslation->active = true;
        $newPageTranslation->title = $this->translation->autoTranslation('404 Page not found', 'en', $this->locale->getLocale()->locale);
        $newPageTranslation->subtitle = '';
        $newPageTranslation->url = '/' . $this->translation->autoTranslation('error', 'en', $this->locale->getLocale()->locale) . '-404';
        $newPageTranslation->description = $this->translation->autoTranslation(
            '404 Page not found',
            'en',
            $this->locale->getLocale()->locale
        );
        $newPageTranslation->externalUrl = false;
        $this->db->persist($newPageTranslation);

        $this->db->flush();
        $this->db->clear();

        return $this;
    }

    /**
     * @return int
     */
    protected function writeConfig()
    {
        $post = $this->request->getGPAsObject();

        $configContent = "<?php
        define('DB_HOST', '{$post->database->host}');
        define('DB_USER', '{$post->database->user}');
        define('DB_PASS', '{$post->database->password}');
        define('DB_DRIVER', '{$post->database->type}');
        define('DB_CHARSET', 'UTF8');
        define('DB_PORT', '{$post->database->port}');
        define('DB_NAME', '{$post->database->name}');
        define('DB_TABLE_PREFIX', '{$post->database->prefix}');
        define('TIMEZONE', '{$post->timezone}');
        define('IMAGE_PROCESSOR', 'GD');
        define('FRAYM_INSTANCE', '" . sprintf("%u", crc32($this->getApplicationDir())) . "');
        if(!defined('ENV')) define('ENV', '{$post->environment}');";

        return file_put_contents($this->_configFile, $configContent);
    }
}