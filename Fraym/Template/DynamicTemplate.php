<?php
/**
 * @link      http://fraym.org
 * @author    Dominik Weber <info@fraym.org>
 * @copyright Dominik Weber <info@fraym.org>
 * @license   http://www.opensource.org/licenses/gpl-license.php GNU General Public License, version 2 or later (see the LICENSE file)
 */
namespace Fraym\Template;

use \Fraym\Block\BlockXml as BlockXml;

/**
 * @Injectable(lazy=true)
 */
class DynamicTemplate
{
    /**
     * @Inject
     * @var \Fraym\Template\DynamicTemplateController
     */
    protected $dynamicTemplateController;

    /**
     * @Inject
     * @var \Fraym\Route\Route
     */
    protected $route;

    /**
     * @Inject
     * @var \Fraym\Block\BlockParser
     */
    protected $blockParser;

    /**
     * @Inject
     * @var \Fraym\Template\Template
     */
    protected $template;

    /**
     * @Inject
     * @var \Fraym\Database\Database
     */
    protected $db;

    /**
     * @Inject
     * @var \Fraym\Registry\Config
     */
    protected $config;

    /**
     * @Inject
     * @var \Fraym\ServiceLocator\ServiceLocator
     */
    protected $serviceLocator;

    /**
     * @Inject
     * @var \Fraym\Request\Request
     */
    public $request;

    /**
     * @Inject
     * @var \Fraym\FileManager\FileManager
     */
    public $fileManager;

    /**
     * @Inject
     * @var \Fraym\Locale\Locale
     */
    public $locale;

    /**
     * @param $blockId
     * @param BlockXml $blockXML
     * @return BlockXml
     */
    public function saveBlockConfig($blockId, \Fraym\Block\BlockXml $blockXML)
    {
        $blockConfig = $this->request->getGPAsObject();
        $customProperties = new \Fraym\Block\BlockXmlDom();

        if(isset($blockConfig->config)) {
            $element = $customProperties->createElement('dynamicTemplateConfig');
            $element->appendChild($customProperties->createCDATASection(serialize($blockConfig->config)));
            $customProperties->appendChild($element);
        }

        $element = $customProperties->createElement('dynamicTemplate');
        $element->nodeValue = $blockConfig->dynamicTemplate;
        $customProperties->appendChild($element);
        $blockXML->setCustomProperty($customProperties);

        return $blockXML;
    }

    /**
     * @param $xml
     * @return mixed
     */
    public function execBlock($xml)
    {
        $template = null;
        $dataSource = null;
        $locale = $this->locale->getLocale();
        $variables = unserialize((string)$xml->dynamicTemplateConfig);

        if (!empty((string)$xml->dynamicTemplate)) {
            $template = $this->getTemplatePath() . DIRECTORY_SEPARATOR . (string)$xml->dynamicTemplate;
        }

        $obj = $this->getTemplateXmlObject((string)$xml->dynamicTemplate);
        
        if (isset($obj->dataSource)) {
            $dataSource = $obj->dataSource;
            $class = (string)$dataSource->class;
            $method = (string)$dataSource->method;

            if (method_exists($class, $method)) {
                $classObj = $this->serviceLocator->get($class);
                $dataSource = $classObj->$method($locale->id, $variables);
            }
        }

        $this->dynamicTemplateController->render($template, $locale->id, $variables, $dataSource);
    }

    /**
     * @param null $blockId
     */
    public function getBlockConfig($blockId = null)
    {
        $configXml = null;

        if ($blockId) {
            $block = $this->db->getRepository('\Fraym\Block\Entity\Block')->findOneById($blockId);
            if ($block->changeSets->count()) {
                $block = $block->changeSets->last();
            }
            $configXml = $this->blockParser->getXmlObjectFromString($this->blockParser->wrapBlockConfig($block));
        }

        $files = $this->getTemplateFiles();
        $selectOptions = $this->buildSelectOptions($files);
        $this->dynamicTemplateController->getBlockConfig($selectOptions, $configXml);
    }

    /**
     * @param $files
     * @param array $options
     * @param null $parentKey
     * @return mixed
     */
    protected function buildSelectOptions($files, &$options = [], $parentKey = null)
    {
        foreach ($files as $file) {
            if ($file['isDir'] === true) {
                if (count($file['files'])) {
                    $newParentKey = ($parentKey ? $parentKey . '/' : '') . $file['name'];
                    $options[$newParentKey] = [];
                    $subFiles = $file['files'];
                    $this->buildSelectOptions($subFiles, $options, $newParentKey);
                }
            } else {
                if ($parentKey) {
                    $options[$parentKey][] = $file['name'];
                } else {
                    $options[] = $file['name'];
                }
            }
        }
        return $options;
    }

    /**
     * @return \Fraym\Registry\Entity\text|string
     */
    protected function getTemplatePath()
    {
        $config = $this->config->get('DYNAMIC_TEMPLATE_PATH');
        if (!empty($config->value)) {
            $path = $config->value;
        } else {
            $path = $this->template->getTemplateDir() . DIRECTORY_SEPARATOR . 'Dynamic';
        }
        return $path;
    }

    /**
     * @return array
     */
    protected function getTemplateFiles()
    {
        $path = $this->getTemplatePath();
        return $this->fileManager->getFiles($path);
    }

    /**
     * @param \Fraym\Block\Entity\Block $block
     * @param $config
     * @return \Fraym\Block\Entity\ChangeSet
     */
    public function createChangeSet(\Fraym\Block\Entity\Block $block, $config) {
        if ($block->changeSets->count()) {
            $block = $block->changeSets->last();
        }
        $changeSet = new \Fraym\Block\Entity\ChangeSet();
        $changeSet->contentId = $block->contentId;
        $changeSet->name = $block->name;
        $changeSet->position = $block->position;
        $changeSet->byRef = $block->byRef;
        $changeSet->menuItem = $block->menuItem;
        $changeSet->site = $block->site;
        $changeSet->menuItemTranslation = $block->menuTranslation;
        $changeSet->extension = $block->extension;
        $changeSet->block = $block->block ?: $block;
        $changeSet->user = $block->user;
        $changeSet->config = $config;
        $changeSet->type = \Fraym\Block\Entity\ChangeSet::EDITED;

        $this->db->persist($changeSet);
        $this->db->flush();

        return $changeSet;
    }

    /**
     * @param $template
     * @return \SimpleXMLElement
     */
    public function getTemplateXmlObject($template)
    {
        $template = $this->getTemplatePath() . DIRECTORY_SEPARATOR . $template;

        $templateContent = file_get_contents($template);
        $blocks = $this->blockParser->getAllBlocks($templateContent);

        foreach ($blocks as $block) {
            $obj = $this->blockParser->getXmlObjectFromString($block);
            if ($this->blockParser->getXmlAttr($obj, 'type') === 'config') {
                return $obj;
            }
        }
    }
}
