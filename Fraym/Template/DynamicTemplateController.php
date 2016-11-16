<?php
/**
 * @link      http://fraym.org
 * @author    Dominik Weber <info@fraym.org>
 * @copyright Dominik Weber <info@fraym.org>
 * @license   http://www.opensource.org/licenses/gpl-license.php GNU General Public License, version 2 or later (see the LICENSE file)
 */
namespace Fraym\Template;

/**
 * Class DynamicTemplateController
 * @package Fraym\Menu
 * @Injectable(lazy=true)
 */
class DynamicTemplateController extends \Fraym\Core
{
    /**
     * @Inject
     * @var \Fraym\Database\Database
     */
    protected $db;

    /**
     * @Inject
     * @var \Fraym\Block\BlockParser
     */
    protected $blockParser;

    /**
     * @Inject
     * @var \Fraym\Block\BlockController
     */
    protected $blockController;

    /**
     * @Inject
     * @var \Fraym\Block\Block
     */
    protected $block;

    /**
     * @Inject
     * @var \Fraym\Template\DynamicTemplate
     */
    protected $dynamicTemplate;

    /**
     * @param $selectOptions
     * @param null $blockConfig
     */
    public function getBlockConfig($selectOptions, $blockConfig = null)
    {
        $this->view->assign('selectOptions', $selectOptions, false);
        $this->view->assign('blockConfig', $blockConfig);
        $this->view->render('BlockConfig');
    }

    /**
     * @param $html
     * @param $locales
     * @param $variables
     */
    public function renderConfig($html, $locales, $variables)
    {
        $this->view->assign('locales', $locales);
        $this->view->assign('config', $variables);
        $this->view->render("string:$html");
    }

    /**
     * @param $template
     * @param $locale
     * @param $variables
     * @param $dataSource
     */
    public function render($template, $locale, $variables, $dataSource = null)
    {
        $this->view->assign('inEditMode', $this->block->inEditMode());
        $this->view->assign('refreshBlock', $this->block->inEditMode() && $this->request->isXmlHttpRequest());
        $this->view->assign('locale', $locale);
        $this->view->assign('dataSource', $dataSource);
        $this->view->assign('config', $variables);
        if (!empty($template)) {
            $this->view->setTemplate($template);
        } else {
            $this->view->setTemplate("string:");
        }
    }

    /**
     * @Fraym\Annotation\Route("/fraym/dynamic-template/inline-editor-save", name="dynamicTemplateSaveInlineEditor", permission={"\Fraym\User\User"="isAdmin"})
     */
    public function saveDynamicTemplateInline() {
        $blockId = $this->request->post('blockId');
        // Convert int key to string
        $configField = json_decode(json_encode((object) $this->request->post('config')), true);

        // Get the block element
        $block = $this->db->getRepository('\Fraym\Block\Entity\Block')->findOneById($blockId);

        // Read the xml config from the block
        $configXml = $this->blockParser->getXmlObjectFromString($this->blockParser->wrapBlockConfig($block));
        $config = unserialize($configXml->dynamicTemplateConfig);
        $config = json_decode(json_encode($config), true);
        $newConfig = array_replace_recursive($config, $configField);

        // Create the new config xml date
        $configXml->dynamicTemplateConfig = serialize($newConfig);
        $newConfig = $this->blockParser->getBlockConfig($this->blockParser->removeXmlHeader($configXml->asXML()));

        // Save changes to new change set
        $changeSet = $this->dynamicTemplate->createChangeSet($block, $newConfig);

        $this->response->sendAsJson(['blockId' => $block->id, 'data' => $this->blockController->prepareBlockOutput($changeSet)]);
    }

    /**
     * @Fraym\Annotation\Route("/fraym/load-dynamic-template-config", name="dynamicTemplateConfig", permission={"\Fraym\User\User"="isAdmin"})
     */
    public function loadDynamicTemplateConfig()
    {
        $template = $this->request->post('template');
        $blockId = $this->request->post('blockId');
        $variables = [];

        if ($blockId) {
            $block = $this->db->getRepository('\Fraym\Block\Entity\Block')->findOneById($blockId);
            if ($block->changeSets->count()) {
                $block = $block->changeSets->last();
            }
            $xml = $this->blockParser->getXmlObjectFromString($this->blockParser->wrapBlockConfig($block));
            $variables = unserialize((string)$xml->dynamicTemplateConfig);
        }

        $localeResult = $this->db->getRepository('\Fraym\Locale\Entity\Locale')->findAll();

        foreach ($localeResult as $locale) {
            $locales[] = $locale->toArray(1);
        }

        $obj = $this->dynamicTemplate->getTemplateXmlObject($template);
        $objTemplate = $obj ? (string)$obj->template : '';

        return $this->renderConfig($objTemplate, $locales, $variables);
    }
}
