Fraym.InlineEditor = {
    init: function() {
        $('[data-inline-editor-field]').attr('contenteditable', 'true');
        $('[data-inline-editor-field]').each(function(){
            var removePlugins = 'toolbar';
            if($(this).data('inline-editor-rte') === true) {
                removePlugins = '';
            }
            CKEDITOR.inline(this, {
                removePlugins: removePlugins,
                on: {
                    blur: function( event ) {
                        var data = event.editor.getData();
                        var url = $(this.element.$).parents('[data-inline-editor-save]').data('inline-editor-save');
                        var field = $(this.element.$).data('inline-editor-field');
                        var blockId = $(this.element.$).parents('[data-id]:first').data('id');

                        data = Fraym.Block.replaceRteLink(data);

                        $.ajax({
                            url: url,
                            dataType: 'json',
                            data: {blockId: blockId, field:field, value:data},
                            type: 'post',
                            success:function (data, textStatus, jqXHR) {

                            }
                        });
                    }
                }
            });
        });
    }
};

Fraym.InlineEditor.init();