<?php
/**
 * @link      http://fraym.org
 * @author    Dominik Weber <info@fraym.org>
 * @copyright Dominik Weber <info@fraym.org>
 * @license   http://www.opensource.org/licenses/gpl-license.php GNU General Public License, version 2 or later (see the LICENSE file)
 */

chdir(__DIR__);

if(!is_dir('Vendor') || is_link('Bootstrap.php')) {
    chdir(realpath(__DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..'));
}

if (is_file('Config.php')) {
    require 'Config.php';
} else {
    echo '<a href="/install.php">Please install Fraym.</a>';
    exit(0);
}

$classLoader = require 'Vendor/autoload.php';

date_default_timezone_set(TIMEZONE);
define('CACHE_DI_PATH', 'Cache/DI');
define('CACHE_DOCTRINE_PROXY_PATH', 'Cache/DoctrineProxies');
define('JS_FOLDER', '/js');
define('CSS_FOLDER', '/css');
define('CONSOLIDATE_FOLDER', '/consolidated');

\Fraym\Cache\Cache::createCacheFolders();

$builder = new \DI\ContainerBuilder();
$builder->useAnnotations(true);

if (\Fraym\Core::ENV_STAGING === ENV || \Fraym\Core::ENV_PRODUCTION === ENV) {
    error_reporting(-1);
    ini_set("display_errors", 0);
    $builder->writeProxiesToFile(true, CACHE_DI_PATH);
    define('GLOBAL_CACHING_ENABLED', true);
    $apcEnabled = (extension_loaded('apc') || extension_loaded('apcu')) && ini_get('apc.enabled');
} else {
    error_reporting(-1);
    ini_set("display_errors", 1);
    define('GLOBAL_CACHING_ENABLED', false);
    $apcEnabled = false;
}

define('APC_ENABLED', $apcEnabled);

if (defined('IMAGE_PROCESSOR') && IMAGE_PROCESSOR === 'Imagick') {
    $builder->addDefinitions(['Imagine' => DI\object('Imagine\Imagick\Imagine')]);
} elseif (defined('IMAGE_PROCESSOR') && IMAGE_PROCESSOR === 'Gmagick') {
    $builder->addDefinitions(['Imagine' => DI\object('Imagine\Gmagick\Imagine')]);
} else {
    $builder->addDefinitions(['Imagine' => DI\object('Imagine\Gd\Imagine')]);
}

$builder->addDefinitions([
    'db.options' => array(
        'driver' => DB_DRIVER,
        'user' =>     DB_USER,
        'password' => DB_PASS,
        'host' =>     DB_HOST,
        'dbname' =>   DB_NAME,
        'charset' => DB_CHARSET
    )
]);

if (APC_ENABLED) {
    $cache = new Doctrine\Common\Cache\ApcuCache();
} else {
    $cache = new Doctrine\Common\Cache\ArrayCache();
}

$cache->setNamespace('Fraym_instance_' . FRAYM_INSTANCE);
$builder->setDefinitionCache($cache);
$diContainer = $builder->build();