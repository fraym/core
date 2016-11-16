{css('fraym/main.css', 'default', 'fraym-main')}
{css('fraym/jquery.contextMenu.css', 'default', 'contextMenu')}
{css('fraym/font-awesome.min.css', 'default', 'font-awesome')}
{js('fraym/libs/jquery.min.js', 'default', 'jquery')}
{js('fraym/libs/jquery.noty.packaged.min.js', 'default', 'noty')}
{js('fraym/libs/jquery-ui.min.js', 'default', 'jqueryui')}
{js('fraym/libs/jquery.contextmenu.js', 'default', 'contextmenu')}
{js('fraym/libs/jquery.ui.nestedSortable.js', 'default', 'ui.nestedSortable')}
{js('fraym/libs/jquery.json-2.2.min.js', 'default', 'json-2.2')}
{js('fraym/libs/jquery.ui.touch-punch.min.js', 'default', 'ui.touch-punch')}
{js('fraym/libs/jquery.coloranimations.js', 'default', 'coloranimations')}
{js('fraym/libs/formsubmit.js', 'default', 'formsubmit')}
{js('fraym/libs/jquery.slimscroll.min.js', 'default', 'slimscroll')}
{js('fraym/libs/jquery.cookie.js', 'default', 'cookie')}
{js('fraym/libs/bootstrap.min.js', 'default', 'bootstrap')}
{js('fraym/libs/ckeditor/ckeditor.js')}
{js('fraym/libs/ckeditor/config.js')}
{js('fraym/libs/ckeditor/adapters/jquery.js')}
{js('fraym/main.js')}
{js('fraym/core/block.js')}
{js('fraym/core/menu.js')}
{js('fraym/core/admin.js')}
{js('fraym/core/inlineeditor.js')}
{js('fraym/core/filemanager.js')}
{js('fraym/selector_config.js')}

<div id="blockConfigMenu">
	<iframe seamless allowtransparency="true" frameborder="0" src="//{i('Fraym\Route\Route')->getSiteBaseURI(false)}{i('Fraym\Route\Route')->getVirtualRoute('adminPanel')->route}?locale_id={i('Fraym\Registry\Config')->get('ADMIN_LOCALE_ID')->value}"></iframe>
</div>


<script type="text/javascript">
	var pageListJson = {i('Fraym\SiteManager\SiteManager')->getRteMenuItemArray()};

	Fraym.Translation = {
		Global: {
			PermissionDenied: '{_('Permission denied!', 'FRAYM_PERMISSION_DENIED')}'
		},
		ContextMenu: {
			AddBlock: '{_('Add block', 'FRAYM_ADMIN_CONTEXT_MENU_ADD_BLOCK')}',
			EditBlock: '{_('Edit block', 'FRAYM_ADMIN_CONTEXT_MENU_EDIT_BLOCK')}',
			CutBlock: '{_('Cut block', 'FRAYM_ADMIN_CONTEXT_MENU_CUT_BLOCK')}',
			CopyBlock: '{_('Copy block', 'FRAYM_ADMIN_CONTEXT_MENU_COPY_BLOCK')}',
			PasteBlock: '{_('Paste block', 'FRAYM_ADMIN_CONTEXT_MENU_PASTE_BLOCK')}',
			PasteAsRefBlock: '{_('Paste as referance', 'FRAYM_ADMIN_CONTEXT_MENU_PASTE_REF_BLOCK')}',
			DeleteBlock: '{_('Delete block', 'FRAYM_ADMIN_CONTEXT_MENU_DELETE_BLOCK')}'
		},
		Menu: {
			DialogTitle: '{_('Select a menu entry', 'FRAYM_SELECT_MENU_DIALOG_TITLE')}'
		},
		FileManager: {
			DialogTitle: '{_('File Manager', 'EXT_FILE_MANAGER')}',
			DialogTitleSelect: '{_('File Manager - Select File / Folder', 'EXT_FILE_MANAGER_SELECT')}',
			DeleteConfirm: '{_('Do you want to delete the file really?', 'FRAYM_FILEMANAGER_DELETE_CONFIRM')}'
		}
	};

	Fraym.FileManager.fileViewerSrc = '//{i('Fraym\Route\Route')->getSiteBaseURI(false)}{i('Fraym\Route\Route')->getVirtualRoute('fileViewer')->route}?locale_id={i('Fraym\Registry\Config')->get('ADMIN_LOCALE_ID')->value}';
	Fraym.FileManager.fileManagerSrc = '//{i('Fraym\Route\Route')->getSiteBaseURI(false)}{i('Fraym\Route\Route')->getVirtualRoute('fileManager')->route}?locale_id={i('Fraym\Registry\Config')->get('ADMIN_LOCALE_ID')->value}';

	Fraym.Admin.EDIT_MODE = {if $inEditMode}true{else}false{/if};
	Fraym.Admin.BLOCK_EDIT_SRC = '//{i('Fraym\Route\Route')->getSiteBaseURI(false)}{i('Fraym\Route\Route')->getVirtualRoute('block')->route}?locale_id={i('Fraym\Registry\Config')->get('ADMIN_LOCALE_ID')->value}';
	Fraym.InlineEditor.defaultSaveUrl = '//{i('Fraym\Route\Route')->getSiteBaseURI(false)}{i('Fraym\Route\Route')->getVirtualRoute('dynamicTemplateSaveInlineEditor')->route}';
</script>