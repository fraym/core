<?php
/**
 * @link      http://fraym.org
 * @author    Dominik Weber <info@fraym.org>
 * @copyright Dominik Weber <info@fraym.org>
 * @license   http://www.opensource.org/licenses/gpl-license.php GNU General Public License, version 2 or later (see the LICENSE file)
 */
namespace Fraym\Image;
use Imagine\Image\ImageInterface;

/**
 * Class Editor
 * @package Fraym\Image
 * @Injectable(lazy=true)
 */
class Editor
{
    /**
     * @var \Imagine\Imagick\Imagine
     * @Inject("Imagine")
     */
    private $imagine = null;

    /**
     * @Inject
     * @var \Fraym\Registry\Config
     */
    protected $config;

    /**
     * @Inject
     * @var \Fraym\FileManager\FileManager
     */
    protected $fileManager;

    /**
     * @var null
     */
    private $imageSource = null;

    /**
     * @var null
     */
    private $imageWidth = null;

    /**
     * @var null
     */
    private $imageHeight = null;

    /**
     * @var null
     */
    private $imageMaxWidth = null;

    /**
     * @var null
     */
    private $imageMaxHeight = null;

    /**
     * @var string
     */
    private $imageQuality = null;

    /**
     * @var string
     */
    private $imageFormat = null;

    /**
     * @var bool
     */
    private $imageOverride = false;

    /**
     * @var null
     */
    private $imageHash = null;

    /**
     * @var null
     */
    private $metaData = null;

    /**
     * @var ImageInterface
     */
    private $image = null;

    /**
     * @var null
     */
    private $font = null;

    /**
     * @param $file
     * @return $this
     */
    public function setFontFile($file) {
        if(is_file($file)) {
            $this->font = $file;
        } else {
            trigger_error('Font file not found! Use the phfont attribute to setup a font file.', E_USER_ERROR);
        }
        return $this;
    }

    /**
     * @param $text
     * @param $width
     * @param $height
     * @param string $fontSize
     * @param string $color
     * @param string $backgroundColor
     * @return $this
     */
    public function createPlaceholder($text, $width, $height, $fontSize = '20', $color = '000', $backgroundColor = 'ddd') {
        $this->metaData = null;
        $this->imageFormat = 'jpg';
        $this->imageSource = null;

        $this->imageWidth = $width;
        $this->imageHeight = $height;

        if ($this->font === null) {
            $this->setFontFile('Public/fonts/fraym/arial.ttf');
        }

        $bgBox = new \Imagine\Image\Box($width, $height);
        $imgColor = new \Imagine\Image\Palette\RGB();
        $img = $this->imagine->create($bgBox, $imgColor->color($backgroundColor));

        $descriptionBoxImg = new \Imagine\Gd\Font(realpath($this->font), $fontSize, $imgColor->color($color));
        $descriptionBoxImg = $descriptionBoxImg->box($text, 0)->getWidth();

        // set the point to start drawing text, depending on parent image width
        $descriptionPositionCenter = ceil(($img->getSize()->getWidth() - $descriptionBoxImg) / 2);

        if ($descriptionPositionCenter < 0) {
            $descriptionPositionCenter = 0;
        }

        $img->draw()->text(
            $text,
            new \Imagine\Gd\Font(realpath($this->font), $fontSize, $imgColor->color($color)),
            new \Imagine\Image\Point($descriptionPositionCenter, $img->getSize()->getHeight() / 2 - ($fontSize/2)),
            0
        );

        $this->image = $img;

        return $this;
    }

    /**
     * @param $image
     * @return $this
     */
    public function setImage($image) {
        $this->image = $image;
        return $this;
    }

    /**
     * @return ImageInterface
     */
    public function getImage() {
        return $this->openImage()->image;
    }

    /**
     * @param $source
     * @return $this
     */
    public function setImageSource($source) {
        $this->imageSource = $source;
        $this->metaData = $this->getImageMetadata();
        return $this;
    }

    /**
     * @param $hash
     * @return $this
     */
    public function setImageHash($hash) {
        $this->imageHash = md5($hash);
        $this->metaData = $this->getImageMetadata();
        return $this;
    }

    /**
     * @return null
     */
    public function getImageMetaInfo() {
        return $this->metaData;
    }

    /**
     * @param null $hash
     * @return boolean
     */
    public function imageExists($hash = null) {
        if($hash) {
            $this->setImageHash($hash);
        }
        if($this->metaData) {
            return $this->metaData->fileExists;
        }
        // Placeholder image
        $savePath = $this->getImageSavePath($this->imageWidth . 'x' . $this->imageHeight . ($this->imageHash ? '-' . $this->imageHash : ''), $this->imageFormat);
        return is_file($savePath);
    }

    /**
     * @return mixed
     */
    public function getImagePath() {
        if($this->metaData) {
            return substr($this->metaData->savePath, strpos($this->metaData->savePath, DIRECTORY_SEPARATOR)+1);
        }
        // Placeholder image
        $savePath = $this->getImageSavePath($this->imageWidth . 'x' . $this->imageHeight . ($this->imageHash ? '-' . $this->imageHash : ''), $this->imageFormat);
        return substr($savePath, strpos($savePath, DIRECTORY_SEPARATOR)+1);
    }

    /**
     * @param $width
     * @return $this
     */
    public function setImageWidth($width) {
        $this->imageWidth = $width;
        return $this;
    }

    /**
     * @param $height
     * @return $this
     */
    public function setImageHeight($height) {
        $this->imageHeight = $height;
        return $this;
    }

    /**
     * @param $maxWidth
     * @return $this
     */
    public function setImageMaxWidth($maxWidth) {
        $this->imageMaxWidth = $maxWidth;
        return $this;
    }

    /**
     * @param $maxHeight
     * @return $this
     */
    public function setImageMaxHeight($maxHeight) {
        $this->imageMaxHeight = $maxHeight;
        return $this;
    }

    /**
     * @param $quality
     * @return $this
     */
    public function setImageQuality($quality) {
        if($quality) {
            $this->imageQuality = $quality;
        }
        return $this;
    }

    /**
     * @param $format
     * @return $this
     */
    public function setImageFormat($format) {
        if($format) {
            $this->imageFormat = $format;
        }

        return $this;
    }

    /**
     * @param bool $override
     * @return $this
     */
    public function setImageOverride($override = true) {
        $this->imageOverride = $override;
        return $this;
    }

    /**
     * @return $this
     * @throws \Exception
     */
    private function openImage() {
        if($this->image === null) {
            if($this->metaData) {
                $this->image = $this->imagine->open($this->metaData->source);
            } else {
                throw new \Exception('Image not found! File: ' . $this->imageSource);
            }
        }
        return $this;
    }

    /**
     * @return null|string
     */
    public function imageResize() {

        $this->openImage();

        $width = $this->imageWidth;
        $height = $this->imageHeight;
        $maxWidth = $this->imageMaxWidth;
        $maxHeight = $this->imageMaxHeight;

        if ($maxWidth === null && $maxHeight !== null) {
            $imageBox = $this->image->getSize()->heighten($maxHeight);

        } elseif ($maxHeight === null && $maxWidth !== null) {
            $imageBox = $this->image->getSize()->widen($maxWidth);

        } elseif ($maxHeight !== null && $maxWidth !== null) {
            $imageBox = $this->image->getSize()->heighten($maxHeight)->widen($maxWidth);

        } elseif ($width !== null && $height !== null) {
            $imageBox = new \Imagine\Image\Box($width, $height);

        } elseif ($width === null && $height !== null) {
            $imageBox = new \Imagine\Image\Box($this->image->getSize()->getWidth(), $height);

        }  elseif ($width !== null && $height === null) {
            $imageBox = new \Imagine\Image\Box($width, $this->image->getSize()->getHeight());

        } else {
            $imageBox = new \Imagine\Image\Box($this->image->getSize()->getWidth(), $this->image->getSize()->getHeight());
        }

        $this->image = $this->image->resize($imageBox);

        return $this;
    }

    /**
     * Return the public path to the resized image
     */
    public function save() {
        $quality = ($this->imageQuality ?: ($this->config->get('IMAGE_QUALITY')->value ? : '80'));
        $this->metaData = $this->getImageMetadata();

        if($this->metaData) {
            $this->imageHash = md5($this->imageSource.$this->imageWidth.$this->imageHeight.$this->imageMaxWidth.$this->imageMaxHeight.$this->imageQuality.$this->imageFormat);
            $metadata = $this->metaData;
            $publicFilePath = substr($metadata->savePath, strpos($metadata->savePath, DIRECTORY_SEPARATOR)+1);

            if($this->imageOverride === false && $metadata->fileExists) {
                return $publicFilePath;
            }
            $savePath = $metadata->savePath;
        } else {
            $savePath = $this->getImageSavePath($this->imageWidth . 'x' . $this->imageHeight . ($this->imageHash ? '-' . $this->imageHash : ''), $this->imageFormat);
            $publicFilePath = substr($savePath, strpos($savePath, DIRECTORY_SEPARATOR)+1);
        }

        $this->openImage()->image->save($savePath, ['quality' => $quality]);

        return $publicFilePath;
    }

    /**
     * Prepares an image thumbnail, based on the target dimensions provided in $size, while preserving proportions.
     * The thumbnail operation returns a new ImageInterface instance that is a processed copy of the original
     * (the source image is not modified). If thumbnail mode is ImageInterface::THUMBNAIL_INSET, the original
     * image is scaled down so it is fully contained within the thumbnail dimensions. The specified $width and
     * $height will be considered maximum limits. Unless the given dimensions are equal
     * to the original image’s aspect ratio, one dimension in the resulting thumbnail will be
     * smaller than the given limit. If ImageInterface::THUMBNAIL_OUTBOUND mode is chosen, then the thumbnail is scaled
     * so that its smallest side equals the length of the corresponding side in the original image.
     * Any excess outside of the scaled thumbnail’s area will be cropped, and the returned thumbnail will have
     * the exact $width and $height specified.
     *
     * @param string $mode
     * @return $this
     * @throws \Exception
     */
    public function imageThumbnail($mode = ImageInterface::THUMBNAIL_INSET) {
        if(!$this->imageWidth || !$this->imageHeight) {
            throw new \Exception('Image width and height must be set!');
        }
        $box = new \Imagine\Image\Box($this->imageWidth, $this->imageHeight);
        $this->image = $this->openImage()->image->thumbnail($box, $mode);
        return $this;
    }

    /**
     * @param $x1
     * @param $y1
     * @param $x2
     * @param $y2
     * @return $this
     */
    public function imageCrop($x1, $y1, $x2, $y2) {
        $this->image = $this->openImage()->image->crop(new \Imagine\Image\Point($x1, $y1), new \Imagine\Image\Box($x2, $y2));
        return $this;
    }

    /**
     * Add a watermark to image. If no position is entered the watermark will be centered.
     *
     * @param $source
     * @param null $x
     * @param null $y
     * @return $this
     */
    public function addWatermark($source, $x = null, $y = null) {
        $watermark = $this->imagine->open($source);
        $wSize = $watermark->getSize();
        if(!$x && !$y) {
            $x = ($this->openImage()->image->getSize()->getWidth() / 2) + ($wSize->getWidth() / 2) - $wSize->getWidth();
            $y = ($this->openImage()->image->getSize()->getHeight() / 2) + ($wSize->getHeight() / 2) - $wSize->getHeight();
        }
        $position = new \Imagine\Image\Point($x, $y);
        $this->image = $this->image->paste($watermark, $position);
        return $this;
    }

    /**
     * @return \stdClass
     */
    public function getImageMetadata() {

        $source = $this->imageSource;
        if(!$source) {
            return null;
        }

        $imageHash = $this->imageHash;
        $format = $this->imageFormat;

        if (filter_var($source, FILTER_VALIDATE_URL)) {
            list($width, $height, $type, $attr) = getimagesize($source);
            $fname = parse_url($source, PHP_URL_PATH);
            $fname = basename($fname);
            $fname = substr($fname, 0, strripos($fname, '.'));

            $pathInfo = [
                'extension' => trim(image_type_to_extension($type), '.'),
                'filename' => $fname,
            ];
        } else {
            $source = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $source);

            // check if source is a absolute url or a web address
            if (substr($source, 0, 1) === '/' || strpos($source, ':') !== false) {
                // absolute path
                $source = $source;
            } else {
                // relative path
                $source = getcwd() . DIRECTORY_SEPARATOR . ltrim($source, '/');
            }

            if (is_file($source) === false) {
                return null;
            }

            $pathInfo = pathinfo($source);
            list($width, $height, $type, $attr) = getimagesize($source);
        }

        if($format === null) {
            $this->setImageFormat($pathInfo['extension']);
            $format = $pathInfo['extension'];
        }

        $imagePath = $this->getImageSavePath($pathInfo['filename'] . ($imageHash ? '-' . $imageHash : ''), $format);

        $metadata = new \stdClass();
        $metadata->source = $source;
        $metadata->savePath = $imagePath;
        $metadata->fileExists = is_file($imagePath);
        $metadata->width = $width;
        $metadata->height = $height;
        $metadata->type = $type;
        $metadata->attr = $attr;
        $metadata->filename = $pathInfo['filename'];
        $metadata->fileExtension = $pathInfo['extension'];

        return $metadata;
    }

    /**
     * @param $filename
     * @param string $ext
     * @return string
     */
    private function getImageSavePath($filename, $ext = 'jpg')
    {
        $convertedImageFileName = trim($this->config->get('IMAGE_PATH')->value, '/');

        if (!is_dir('Public' . DIRECTORY_SEPARATOR . $convertedImageFileName)) {
            mkdir('Public' . DIRECTORY_SEPARATOR . $convertedImageFileName, 0755, true);
        }

        $convertedImageFileName .= DIRECTORY_SEPARATOR . $filename . '.' . $ext;

        return 'Public' . DIRECTORY_SEPARATOR . trim($this->fileManager->convertDirSeparator($convertedImageFileName), '/');
    }
}
