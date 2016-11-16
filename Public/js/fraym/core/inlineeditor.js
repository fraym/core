Fraym.InlineEditor = {
    defaultSaveUrl: '',
    instances: [],

    saveField: function(element, dataAttr, data, callback) {
        var url = $(element).parents('[data-inline-editor-save]').data('inline-editor-save') || Fraym.InlineEditor.defaultSaveUrl;
        var field = $(element).data(dataAttr);
        var $block = $(element).parents('[data-id]:first');
        var blockId = $block.data('id');

        var formData = new FormData();
        formData.append(field, data);
        formData.append('blockId', blockId);

        $.ajax({
            url: url,
            dataType: 'json',
            data: formData,
            processData: false,
            contentType: false,
            type: 'post',
            success:function (json, textStatus, jqXHR) {
                $block.addClass('changeset');
                if(callback) {
                    callback(json, textStatus, jqXHR);
                }
            }
        });
    },

    init: function() {

        $('[data-inline-editor-field]').attr('contenteditable', 'true');

        for(var key in Fraym.InlineEditor.instances)
        {
            CKEDITOR.instances[Fraym.InlineEditor.instances[key]].destroy();
        }

        Fraym.InlineEditor.instances = [];

        $('[data-inline-editor-image]').each(function(){
            var $inlineEditorElement = this;
            var $selectImageLink = $('<a class="inline-editor-image" data-filepath href="#"></a>');
            $selectImageLink.data('filefilter', $($inlineEditorElement).data('filefilter'));
            $selectImageLink.data('singlefileselect', $($inlineEditorElement).data('singlefileselect'));
            $selectImageLink.change(function(e, data){
                Fraym.InlineEditor.saveField($inlineEditorElement, 'inline-editor-image', data, function(json) {
                    Fraym.Block.replaceBlock(json.blockId, json.data);
                });
            });
            $(this).append($selectImageLink);
        });

        Fraym.FileManager.initFilePathInput();

        $('[data-inline-editor-field]').each(function(){

            var removePlugins = 'toolbar';
            var removeButtons = 'Image,Flash,Table,HorizontalRule,SpecialChar,Iframe,find,selection,spellchecker,Find,Replace,SelectAll,Scayt,NewPage,Templates,ShowBlocks';

            if($(this).data('inline-editor-rte') === true) {
                removePlugins = '';
            }

            var instance = CKEDITOR.inline(this, {
                removePlugins: removePlugins,
                removeButtons: removeButtons,
                basicEntities: false,
                autoParagraph: false,
                on: {
                    blur: function( event ) {
                        var data = event.editor.getData();
                        data = Fraym.Block.replaceRteLink(data);
                        Fraym.InlineEditor.saveField(this.element.$, 'inline-editor-field', data);
                    }
                }
            });

            Fraym.InlineEditor.instances.push(instance.name);

            $(this).click(function(){
                $(this).focus();
            });
        });
    }
};