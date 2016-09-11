<div {if $type == 'content'} class="block-container"{if $style} style="{$style}"{/if}{else} class="block-holder{if $block.byRef} by-ref{/if}{if get_class($block) === 'Fraym\Block\Entity\ChangeSet' || ($block->changeSets && $block->changeSets->count())} changeset{/if}" data-id="{$id}"{if $block && $block->byRef} data-byRef="{$block->byRef->id}"{/if}{/if}>

    {if $type !== 'content'}
        <div class="block-info">
            <i class="fa fa-exchange"></i> {if $moduleName}{$moduleName} :{else}Static{/if} {$renderTime}
            <div class="block-holder-actionbar">
                <a class="paste" href="#" title="{_('Paste block after this', 'FRAYM_ADMIN_CONTEXT_MENU_PASTE_BLOCK_AFTER')}"><i class="fa fa-clipboard"></i></a>
                <a class="pasteref" href="#" title="{_('Paste as referance after this', 'FRAYM_ADMIN_CONTEXT_MENU_PASTE_REF_BLOCK_AFTER')}"><i class="fa fa-exchange"></i></a>
                <a class="add-after" href="#" title="{_('Add new block after this', 'FRAYM_ADMIN_CONTEXT_MENU_ADD_AFTER_BLOCK')}"><i class="fa fa-plus-square"></i></a>
                <a class="delete" href="#" title="{_('Delete block', 'FRAYM_ADMIN_CONTEXT_MENU_DELETE_BLOCK')}"><i class="fa fa-trash-o"></i></a>
                <a class="cut" href="#" title="{_('Cut block', 'FRAYM_ADMIN_CONTEXT_MENU_CUT_BLOCK')}"><i class="fa fa-cut"></i></a>
                <a class="copy" href="#" title="{_('Copy block', 'FRAYM_ADMIN_CONTEXT_MENU_COPY_BLOCK')}"><i class="fa fa-copy"></i></a>
                <a class="edit" href="#" title="{_('Edit block', 'FRAYM_ADMIN_CONTEXT_MENU_EDIT_BLOCK')}"><i class="fa fa-pencil"></i></a>
            </div>
        </div>
    {/if}

    <div class="block-container-content">
        {{$content}}
    </div>
</div>