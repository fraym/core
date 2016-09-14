Fraym.InlineEditor = {
    defaultSaveUrl: '',
    instances: [],
    init: function() {
        $('[data-inline-editor-field]').attr('contenteditable', 'true');

        for(var key in Fraym.InlineEditor.instances)
        {
            CKEDITOR.instances[Fraym.InlineEditor.instances[key]].destroy();
        }

        Fraym.InlineEditor.instances = [];

        $('[data-inline-editor-field]').each(function(){
            var removePlugins = 'toolbar';
            if($(this).data('inline-editor-rte') === true) {
                removePlugins = '';
            }

            var instance = CKEDITOR.inline(this, {
                removePlugins: removePlugins,
                basicEntities: false,
                on: {
                    blur: function( event ) {
                        var data = event.editor.getData();

                        var url = $(this.element.$).parents('[data-inline-editor-save]').data('inline-editor-save') || Fraym.InlineEditor.defaultSaveUrl;
                        var field = $(this.element.$).data('inline-editor-field');
                        var $block = $(this.element.$).parents('[data-id]:first');
                        var blockId = $block.data('id');

                        data = Fraym.Block.replaceRteLink(data);

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
                            success:function (data, textStatus, jqXHR) {
                                $block.addClass('changeset');
                            }
                        });
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

Fraym.InlineEditor.init();