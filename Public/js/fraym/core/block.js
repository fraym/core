/**
 * @link      http://fraym.org
 * @author    Dominik Weber <info@fraym.org>
 * @copyright Dominik Weber <info@fraym.org>
 * @license   http://www.opensource.org/licenses/gpl-license.php GNU General Public License, version 2 or later (see the LICENSE file)
 */
Fraym.Block = {
	dragging: false,
	url: '',
	CodeMirror: false,
	dialogContentId: '',
	dialogBlockId: '',
	insertAfterElement: null,
	dialogWithIframe: false,

	loadDefaultConfig: function (json) {
		var $baseElement = $('body');

		$baseElement.find('#extension option[value="' + json.id + '"]').prop('selected', 'selected');
		Fraym.Block.getExtensionConfigView(json.id, json);

		$baseElement.find(Fraym.$.BLOCK_TEMPLATE_SELECTION).removeAttr('disabled');

		if (typeof json.xml != 'undefined') {
			var xmlData = json.xml;

			if (typeof xmlData.template != 'undefined' && xmlData.template['@type'] == 'string') {
				$baseElement.find('#template').children(Fraym.$.BLOCK_TEMPLATE_SELECTION_CUSTOM).prop('selected', 'selected');
				$baseElement.find('textarea[name=templateContent]').val(xmlData.template.$);
			} else if (typeof xmlData.template != 'undefined' && $.isNumeric(xmlData.template['@type'])) {
				$baseElement.find('#template').find('[value="' + xmlData.template['@type'] + '"]').prop('selected', 'selected');
			} else {
				$baseElement.find('#template').children('option[value=""]').prop('selected', 'selected');
				$baseElement.find('input[name="templateFile"]').val(xmlData.template.$);
				$baseElement.find('input[name="name"]').val(json.blockName);
				$baseElement.find('#template').change();
			}

			if (Fraym.Block.CodeMirror) {
				Fraym.Block.CodeMirror.setValue($("#templateContent").val());
			}

			$baseElement.find(Fraym.$.BLOCK_TEMPLATE_SELECTION).change();

			if (typeof xmlData.startDate != 'undefined') {
				$baseElement.find('[name=startDate]').val(xmlData.startDate);
			}

			if (typeof xmlData.endDate != 'undefined') {
				$baseElement.find('[name=endDate]').val(xmlData.endDate);
			}

			if (typeof xmlData.permissions != 'undefined') {
				$.each(xmlData.permissions, function (key, perm) {
					if ($.isArray(perm)) {
						$.each(perm, function (custKey, custPerm) {
							$baseElement.find('.permission:last option[value="' + custPerm['@identifier'] + '"]').prop('selected', 'selected');
						});
					} else {
						$baseElement.find('.permission:last option[value="' + perm['@identifier'] + '"]').prop('selected', 'selected');
					}
				});
			}

			if (typeof xmlData.excludedDevices != 'undefined') {
				$.each(xmlData.excludedDevices, function (key, devices) {
					if ($.isArray(devices)) {
						$.each(devices, function (custKey, custDevice) {
							$baseElement.find('.excludedDevices:last option[value="' + custDevice['@type'] + '"]').prop('selected', 'selected');
						});
					} else {
						$baseElement.find('.excludedDevices:last option[value="' + devices['@type'] + '"]').prop('selected', 'selected');
					}
				});
			}

			$baseElement.find('[name=active] option[value=' + xmlData.active + ']').prop('selected', 'selected');

			if (typeof xmlData.cache != 'undefined') {
				$baseElement.find('[name=cache] option[value=' + xmlData.cache + ']').prop('selected', 'selected');
			}
		}

		if (typeof json.menuItem != 'undefined' && (json.menuItem === null || json.menuItem.length === 0)) {
			$baseElement.find('#all-pages').prop('checked', 'checked');
		}

		if (typeof json.menuItemTranslation != 'undefined' && json.menuItemTranslation != null) {
			$baseElement.find('#menuTranslation').val('current');
		}

		$baseElement.find('[type="submit"]').removeAttr('disabled');
		Fraym.Block.initElements();
	},

	initElements: function () {
		$('select').trigger("chosen:updated");

		$('[data-repeat-item-remove]').unbind('click').click(function(e){
			e.preventDefault();
			$(this).parents('[data-repeat]:first').remove();
		});

		var firstRemoved = [];
		$.each($('[data-repeat]'), function(){
			var name = $(this).attr('data-repeat');
			if(firstRemoved.indexOf(name) < 0) {
				firstRemoved.push(name);
				$('[data-repeat="' + name + '"]:first').find('[data-repeat-item-remove]').hide();
			}
		});

		$('[data-repeat-add]').unbind('click').click(function(){
			var $firstItem = $('[data-repeat="' + $(this).attr('data-repeat-add') + '"]:first');
			var $clone = $firstItem.clone();
			$clone.find('div.cke').remove();
			$clone.find('textarea').removeAttr('id').css({ display: '', visibility: '' });
			$clone.find('textarea,input[type=text],input[type=email],input[type=date],input[type=datetime],input[type=color],input[type=password]').val('');
			$clone.find('select > option').removeAttr('selected');
			$clone.find('.fraym-file-input-wrapper i').remove();
			$clone.find('[data-filepath]').unwrap().removeClass('fraym-file-select');
			$clone.find('[type=radio], [type=checkbox]').removeAttr('checked').prop('checked', false);
			var count = $('[data-repeat="' + $(this).attr('data-repeat-add') + '"]').length+1;
			$clone.find('[data-repeat-item-pos]').html(count);
			$clone.find('[data-repeat-item-remove]').show().click(function(e){
				e.preventDefault();
				$clone.remove();
			});
			$.each($clone.find('input[type=text],textarea'), function(){
				$(this).val('');
				$(this).attr('name', $(this).attr('name').replace('][1]', '][' + count + ']'));
			});
			$clone.insertAfter($('[data-repeat="' + $(this).attr('data-repeat-add') + '"]').last());
			Fraym.Block.initElements();
		});

		$.each($('[data-rte]'), function () {
			if(!$(this).attr('id')) {
				$(this).attr('id', Fraym.getUniqueId());
				var id = $(this).attr('id');
				if($(this).attr('data-rte') !== undefined) {
					try {
						var config = JSON.parse($(this).attr('data-rte'));
					} catch(e) {
						var config = {};
					}
				} else {
					var config = {};
				}

				config['filebrowserBrowseUrl'] = window.filebrowserBrowseUrl;
				config['filebrowserImageBrowseUrl'] = window.filebrowserImageBrowseUrl;
				config['filebrowserWindowWidth'] = window.filebrowserWindowWidth;
				config['filebrowserWindowHeight'] = window.filebrowserWindowHeight;

				CKEDITOR.replace(id, config);
				CKEDITOR.instances[id].on('change', function() {
					CKEDITOR.instances[id].updateElement();
				});
			}
		});

		Fraym.Block.replaceRteBlockLinks();

		$.each($('[data-datepicker]'), function () {
			$(this).datepicker({ dateFormat: $(this).attr('data-datepicker') });
		});

		$.each($('[data-datetimepicker]'), function () {
			$(this).datetimepicker({ dateFormat: $(this).attr('data-datetimepicker') });
		});


		var inputEvent = function (e) {
			e.preventDefault();
			var $this = $(this);

			Fraym.Menu.openSelectMenuDialog(function(node){
				if($this.is('select')) {
					$this.html($('<option></option>').val(node.data.key).html(node.data.title));
				} else {
					$this.siblings('input:not([type=hidden])').attr('disabled', 'disabled').val(node.data.title);
					$this.siblings('input[type=hidden]').removeAttr('disabled').val(node.data.key);
				}
			});
		};

		$.each($('input[data-menuselection]'), function(){
			var $this = $(this).clone(true);
			var $hiddenClone = $(this).clone(true).attr('type', 'hidden').attr('disabled', 'disabled');
			if($this.attr('data-value') != '') {
				$hiddenClone.val($this.val());
				$this.val($this.attr('data-value'));
				$this.attr('disabled', 'disabled');
			}
			$this.addClass('fraym-menu-select');
			var $selectFileBtn = $('<i class="fa fa-sitemap"></i>');
			var $wrapper = $('<div class="fraym-menu-input-wrapper"></div>');
			$wrapper.append($this);
			$wrapper.append($hiddenClone);
			$wrapper.append($selectFileBtn);
			$(this).replaceWith($wrapper);
			$wrapper.click(function(){
				if($this.is(':disabled')) {
					$this.val('').removeAttr('disabled').focus();
					$hiddenClone.attr('disabled', 'disabled');
				}
			});
			$selectFileBtn.click(inputEvent);
		});

		$('body').off('mousedown', 'select[data-menuselection]').on('mousedown', 'select[data-menuselection]', inputEvent);

		Fraym.FileManager.initFilePathInput();
	},

	addTab: function (title, html) {
		$(Fraym.$.BLOCK_TABS).tabs("destroy");
		var count = ($(Fraym.$.BLOCK_TABS).find('ul > li').length + 1);
		$(Fraym.$.BLOCK_TABS).children('ul').append('<li><a href="#block-tabs-' + count + '">' + title + '</a></li>');
		$(Fraym.$.BLOCK_TABS).append($('<div id="block-tabs-' + count + '" class="custom-tab-content"></div>').html(html));
		$(Fraym.$.BLOCK_TABS).tabs({activate: function(){$('select:not(.default)').chosen();}});
		$('[href="#block-tabs-' + count + '"]').effect('highlight', {}, 1000);
	},

	removeTabs: function () {
        $('select').chosen('destroy');

		$(Fraym.$.BLOCK_TABS).tabs("destroy");
		$(Fraym.$.BLOCK_TABS).find('ul > li:not(:first), .custom-tab-content').remove();
		$(Fraym.$.BLOCK_TABS).tabs();

        $('select:not(.default)').chosen({
            search_contains: true
        });
	},

	init: function () {

		Fraym.Block.initBlockActions();

		if(Fraym.Admin.EDIT_MODE) {
			$('body', Fraym.getBaseWindow().document).addClass('fraym-edit-mode-enabled');
		} else {
			$('body', Fraym.getBaseWindow().document).addClass('fraym-edit-mode-disabled');
		}

		// Create wrapper for sidebar
		$('body > *:not(#blockConfigMenu)').wrapAll('<div class="fraym-wrapper"/>');

		// Reposition fixed elements for sidebar
		$('*:not(#blockConfigMenu)').filter(function() {
			return $(this).css("position") === 'fixed' && parseFloat($(this).css("left")) < parseFloat($(this).css("right")) && parseFloat($(this).css("left")) < $('#blockConfigMenu').outerWidth();
		}).addClass('fraym-fixed-position');

		if(typeof $.cookie != 'undefined') {
			if(typeof $.cookie('copy') != 'undefined') {
				Fraym.Block.copyBlock($.cookie('copy'));
			} else if(typeof $.cookie('cut') != 'undefined') {
				Fraym.Block.cutBlock($.cookie('cut'));
			}
		}

		$(document).keypress(function (e) {
			if (!(event.which == 5 && event.ctrlKey)) {
				return true;
			}
			e.preventDefault();
			Fraym.Admin.setEditMode();
		});

		$(Fraym.$.BLOCK_BLOCK_TO_TOP).click(function(e){
			e.preventDefault();
			var $container = $(this).parents('.block-container-content:first, .block-container:first');
			if($(this).hasClass('active')) {
				$(this).removeClass('active');
				$container.css('z-index', '');
			} else {
				$(this).addClass('active');
				$container.css('z-index', '9000');
			}
		});

		if (Fraym.Admin.isMobile() == false) {
			// adding hover evects
			$('body').on('mouseenter', Fraym.$.BLOCK_CONTAINER, function (e) {
				if (e.shiftKey == false && Fraym.Block.dragging == false) {
					$(this).animate({borderColor: 'rgba(0, 137, 205, 1.0)'});
					$(this).find(Fraym.$.BLOCK_VIEW_CONTAINER).css({borderColor: 'rgba(0, 137, 205, 1.0)'});
					$(this).find(Fraym.$.BLOCK_VIEW_INFO_CONTAINER).css({opacity: '1'});
				}
			});
			$('body').on('mouseleave', Fraym.$.BLOCK_CONTAINER, function (e) {
				if (e.shiftKey == false && Fraym.Block.dragging == false) {
					$(this).animate({borderColor: 'rgba(0, 137, 205, 0.0)'});
					$(this).find(Fraym.$.BLOCK_VIEW_CONTAINER).css({borderColor: 'rgba(0, 137, 205, 0.0)'});
					$(this).find(Fraym.$.BLOCK_VIEW_INFO_CONTAINER).css({opacity: '0'});
				}
			});

			$('body').on('mouseenter', Fraym.$.BLOCK_HOLDER + ':not(' + Fraym.$.BLOCK_CONTAINER + ')', function (e) {
				if(e.shiftKey == false) {
					if($(this).hasClass('changeset')) {
						$(this).css({borderColor: 'rgba(255, 165, 0, 1.0)'});
					} else {
						$(this).css({borderColor: 'rgba(23, 184, 19, 1.0)'});
					}

					$(this).find(Fraym.$.BLOCK_INFO).css({opacity: '1'}).show();
				}
			});

			$('body').on('mouseleave', Fraym.$.BLOCK_HOLDER + ':not(' + Fraym.$.BLOCK_CONTAINER + ')', function (e) {
				if(e.shiftKey == false) {
					if($(this).hasClass('changeset')) {
						$(this).css({borderColor: 'rgba(255, 165, 0, 0)'});
					} else {
						$(this).css({borderColor: 'rgba(23, 184, 19, 0)'});
					}

					$(this).find(Fraym.$.BLOCK_INFO).css({opacity: '0'}).hide();
				}
			});
		} else {
			$(Fraym.$.BLOCK_HOLDER + ':not(' + Fraym.$.BLOCK_CONTAINER + ')').css({borderColor: 'rgba(23, 184, 19, 1.0)'});
			$(Fraym.$.BLOCK_INFO).css({opacity: '1'});
			$(Fraym.$.BLOCK_VIEW_CONTAINER).css({borderColor: 'rgba(0, 137, 205, 1.0)'});
			$(Fraym.$.BLOCK_VIEW_INFO_CONTAINER).css({opacity: '1'});
		}

		$('body').on('dblclick', Fraym.$.BLOCK_INFO, function () {
			Fraym.Block.showBlockDialog($(this).parents(Fraym.$.BLOCK_VIEW_CONTAINER).attr('id'), $(this).parent().data('id'));
		});
	},

	replaceRteLinks: function() {
		if (typeof CKEDITOR != 'undefined') {
			for (var instance in CKEDITOR.instances) {
				try {
					var data = Fraym.Block.replaceRteLink(CKEDITOR.instances[instance].getData());
					CKEDITOR.instances[instance].setData(data);
				} catch(e) {
					delete CKEDITOR.instances[instance];
				}
			}
		}
	},

	replaceRteLink: function(data) {
		var html = $('<div>' + data + '</div>');
		if(html.find('[data-page-link]').length) {
			$.each(html.find('[data-page-link]'), function(kk, l){
				if($(l).parent('block').length) {
					$(l).unwrap();
				}
				var $linkHtml = $('<div/>').html($(l).clone().removeAttr('data-page-link'));
				var $blockLink = $('<block type="link" translation="true">' + $linkHtml.html() + '</block>');
				$(l).replaceWith($blockLink);
			});
			return html.html();
		}
		return data;
	},

	replaceRteBlockLinks: function() {
		if (typeof CKEDITOR != 'undefined') {
			for (var instance in CKEDITOR.instances) {
				try {
					var html = $('<div>' + CKEDITOR.instances[instance].getData() + '</div>');
					$.each(html.find('block'), function(){
						var $link = $($(this).html());
						$link.attr('data-page-link', $link.attr('href'));
						$(this).replaceWith($link);
					});
					CKEDITOR.instances[instance].setData(html.html());
				} catch(e) {
					delete CKEDITOR.instances[instance];
				}
			}
		}
	},

	initIframeContent: function () {
		// init tabs on block dialog
		$(Fraym.$.BLOCK_TABS).tabs();
		$('select:not(.default)').chosen({
			search_contains: true
		});

		$('.overlay-save').click(function (e) {
			e.preventDefault();
			$('form').data('closeonsuccess', false);
			$('form').submit();
		});

		$('.overlay-save-and-close').click(function (e) {
			e.preventDefault();
			$('form').data('closeonsuccess', true);
			$('form').submit();
		});

		Fraym.FileManager.initFilePathInput();

		$('form#block-add-edit-form').formSubmit({
			url: Fraym.getAjaxRequestUri(),
			'beforeSubmit': function(f) {
				Fraym.Block.replaceRteLinks();
				$(Fraym.Block).trigger('saveBlockConfig');
			},
			'onSuccess': function (json) {
				$(Fraym.Block).trigger('blockConfigSaved');
				if (json && json.data) {
					if ($(Fraym.$.BLOCK_CURRENT_INPUT).val() == '') {

						if(Fraym.getBaseWindow().Fraym.Block.insertAfterElement) {
							var $blockHolder = $(json.data);
							$blockHolder.insertAfter(Fraym.getBaseWindow().Fraym.Block.insertAfterElement);
							Fraym.Block.saveSorting($blockHolder);
						} else {
							Fraym.getBaseWindow().$('#' + $(Fraym.$.BLOCK_CURRENT_CONTENTID_INPUT).val()).prepend(json.data);
						}

						Fraym.getBaseWindow().Fraym.Block.initBlockActions();
					} else {
						Fraym.Block.replaceBlock($(Fraym.$.BLOCK_CURRENT_INPUT).val(), json.data);
					}
					$(Fraym.$.BLOCK_CURRENT_INPUT).val(json.blockId);
					$(Fraym.$.BLOCK_CURRENT_VIEW).html(json.blockId);
				} else {
					Block.showMessage('Error check your config');
				}

				if($('form').data('closeonsuccess') == true) {
					Fraym.getBaseWindow().$(Fraym.$.BLOCK_OVERLAY).dialog('close');
				}
				Fraym.Block.replaceRteBlockLinks();
			},
			dataType: 'json'
		});

		if ($(Fraym.$.BLOCK_DATETIME_INPUT).length) {
			$(Fraym.$.BLOCK_DATETIME_INPUT).datetimepicker({dateFormat: 'yy-mm-dd'});
		}

		$(Fraym.$.BLOCK_EXTENSION_INPUT).change(function () {
			// unbind all save events
			$(Fraym.Block).unbind('saveBlockConfig');
			$(Fraym.Block).unbind('blockConfigsaved');
			if ($(this).val() == '') {
				$(Fraym.$.BLOCK_TEMPLATE_SELECTION).attr('disabled', 'disabled');
				return;
			}
			Fraym.Block.loadConfig({extensionId: $(this).val()});
		});

		if ($("#templateContent").length) {
			Fraym.Block.CodeMirror = CodeMirror.fromTextArea($("#templateContent").get(0), {
				lineNumbers: true,
				lineWrapping: true,
				autoCloseBrackets: true,
				autoCloseTags: true,
				mode: "text/html",
				styleActiveLine: true,
				tabMode: "indent",
				matchTags: {bothTags: true},
				extraKeys: {"Ctrl-J": "toMatchingTag"}
			});
			Fraym.Block.CodeMirror.on("change", function(cm, change) {
				$("#templateContent").val(cm.getValue());
			});
		}

		$(Fraym.$.BLOCK_TEMPLATE_SELECTION).change(function () {
			if ($(this).val() == 'custom') {
				$('.template-content').show();
				$('.template-file-select').hide();
				Fraym.Block.CodeMirror.refresh();
			} else if($.isNumeric($(this).val())) {
				$('.template-file-select').hide();
				$('.template-content').hide();
			} else {
				$('.template-file-select').show();
				$('.template-content').hide();
			}
		}).change();

		if ($(Fraym.$.BLOCK_CURRENT_INPUT).length) {

			var currentBlockId = $(Fraym.$.BLOCK_CURRENT_INPUT).val();
			if (currentBlockId.length) {
				Fraym.Block.loadConfig({id: currentBlockId});
			}
		}

		var saveBlockHotKey = function (event) {
			if (!(event.which == 115 && event.ctrlKey) && !(event.which == 19)) return true;
			event.preventDefault();
			$('button[type=submit]').click();
			return false;
		};
		$(window).keypress(saveBlockHotKey);
	},

	toggleActionBarSubmenu: function (e) {
		$(e.target).parents('.block-holder-actionbar:first').find('.block-holder-actionbar-submenu').toggle();
	},

	initBlockActions: function () {

		/**
		 * Reactivate inline editor, because of the element replace
		 */
		Fraym.getBaseWindow().Fraym.InlineEditor.init();

		$('.block-holder-actionbar-submenu-toggle').unbind('click').click(function(e){
			e.preventDefault();
			e.stopPropagation();
			Fraym.Block.toggleActionBarSubmenu(e);
		});

		$('body').unbind('click').click(function(){
			$('.block-holder-actionbar-submenu').hide();
		});

		$.each($(Fraym.$.BLOCK_HOLDER), function(){
			if(!$(this).hasClass('action-added')) {
				$(this).addClass('action-added');
				Fraym.Block.addBlockActions($(this).attr('data-id'));
			}
		});

		$.each($(Fraym.$.BLOCK_VIEW_CONTAINER), function(){
			if(!$(this).hasClass('action-added')) {
				$(this).addClass('action-added');
				Fraym.Block.addViewActions($(this).attr('id'));
			}
		});

		var start = false;
		$(Fraym.$.BLOCK_VIEW_CONTAINER).sortable({
			placeholder: 'draghelper',
			connectWith: Fraym.$.BLOCK_VIEW_CONTAINER,
			handle: Fraym.$.BLOCK_INFO,
			tolerance:"pointer",
			cancel: ".block-holder-actionbar",
			cursorAt: { top:0, left: 0 },
			start: function (ev, ui) {
				start = true;
				ev.stopPropagation();
			},
			receive: function (ev, ui) {
				ev.stopPropagation();
			},
			stop: function (ev, ui) {
				if(start) {
					ev.stopPropagation();
					start = false;
					Fraym.Block.saveSorting(ui.item);
				}
			}
		});
	},

	saveSorting: function($blockHolder) {

		var contentId = $blockHolder.parent().attr('id');
		var contentBlocks = [];

		$.each($blockHolder.parent().children(Fraym.$.BLOCK_HOLDER), function(){
			var blockElement = {contentId: contentId, blockId: $(this).data('id'), menuId: Fraym.getBaseWindow().menu_id};
			contentBlocks.push(blockElement);
		});

		if ($.trim(contentId) != '') {
			var parentWindow = Fraym.getBaseWindow();
			var location = parentWindow.location.href.substring(parentWindow.location.protocol.length+2);
			$.ajax({
				url:Fraym.getAjaxRequestUri(),
				dataType:'json',
				data:{cmd:'moveBlockToView', blocks: contentBlocks, location: location},
				type:'post',
				success:function (data, textStatus, jqXHR) {
					if (data.success == false) {
						Fraym.showMessage(Fraym.getBaseWindow().Fraym.Translation.Global.PermissionDenied);
					}
				}
			});
		}
	},

	addViewActions: function (id) {
		if (id == '') {
			return;
		}

		$('#' + id + '-block-container-actionbar').find('a.add:first').click(function(e){
			e.preventDefault();
			Fraym.Block.showBlockDialog(id);
		});

		$('#' + id + '-block-container-actionbar').find('a.paste:first').click(function(e){
			e.preventDefault();
			Fraym.Block.pasteBlock(id, false);
		});

		$('#' + id + '-block-container-actionbar').find('a.pasteref:first').click(function(e){
			e.preventDefault();
			Fraym.Block.pasteBlock(id, true);
		});
	},

	loadConfig: function (data) {
		$('body').mask({
			spinner: { lines: 10, length: 5, width: 3, radius: 10}
		});
		$.ajax({
			url: Fraym.getAjaxRequestUri(),
			dataType: 'json',
			data: $.extend({cmd: 'getBlockConfig'}, data),
			type: 'post',
			success: function (json, textStatus, jqXHR) {
				$('body').unmask();

				if (json != null) {
					Fraym.Block.loadDefaultConfig(json);
				} else if (typeof data != 'undefined' && data.id) {
					$(Fraym.$.BLOCK_DIALOG + ',' + Fraym.$.BLOCK_OVERLAY).remove();
					Fraym.showMessage(Fraym.getBaseWindow().Fraym.Translation.Global.PermissionDenied);
				} else if (typeof data != 'undefined' && data.extensionId) {
					$(Fraym.$.BLOCK_IFRAME).contents().find('#extension option:first').prop('selected', 'selected');
					Fraym.showMessage(Fraym.getBaseWindow().Fraym.Translation.Global.PermissionDenied);
				}
				$('select').trigger("chosen:updated");
			}
		});
	},

	showDialog: function (dialogSettings, iframeSrc) {
		var settings = $.extend({
			dialogClass: 'block-dialog',
			title: 'Dialog',
			height: 670,
			width: 800,
			resizable: true,
			hide: {effect: "fade", duration: 200},
			show: {effect: "fade", duration: 200},
			close: function () {
				$(this).remove();
			}}, dialogSettings);

		var $newDialog = $('<div></div>');
		var $iframe = $('<iframe frameborder="0" src="about:blank" seamless></iframe>');

		$iframe.css({height: '100%', width: '100%'}).attr('src', iframeSrc);
		$newDialog.addClass(Fraym.$.BLOCK_OVERLAY.replace('.', ''));
		$newDialog.append($iframe);
		var dialog = $newDialog.dialog(settings);
		var titlebar = dialog.parents('.ui-dialog').find('.ui-dialog-titlebar');

		$(window).bind('mouseover', function(e){
			if(e.target.tagName === 'IFRAME') {
				$('body').css({overflow: 'hidden'});
			} else {
				$('body').css({overflow: 'visible'});
			}
		});

		$('<div class="ui-dialog-titlebar-buttons"></div>')
			.append(titlebar.find('button'))
			.prepend($('<button class="ui-dialog-titlebar-refresh-iframe ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only"><span class="ui-button-text">refresh</span><span class="ui-button-icon-primary ui-icon ui-icon-arrowrefresh-1-w"></span></button>')
				.click(function () {
					$iframe.get(0).contentWindow.location.reload();
				})).appendTo(titlebar);

		return $newDialog;
	},

	showBlockDialog: function (contentId, currentBlockId, insertAfterElement) {
		Fraym.Block.dialogContentId = contentId;
		Fraym.Block.dialogBlockId = currentBlockId;
		Fraym.Block.insertAfterElement = insertAfterElement;
		$(Fraym.$.BLOCK_DIALOG + ',' + Fraym.$.BLOCK_OVERLAY).remove();
		Fraym.Block.dialogWithIframe = Fraym.Block.showDialog({title: 'Block config', dialogClass: 'block-dialog'}, Fraym.Admin.BLOCK_EDIT_SRC);
	},

	getExtensionConfigView: function (extensionId, extensionJsonData) {
		var blockId = $(Fraym.$.BLOCK_CURRENT_INPUT).val();
		$.ajax({
			url: Fraym.getAjaxRequestUri(),
			dataType: 'html',
			data: {cmd: 'getExtensionConfigView', id: extensionId, blockId: blockId},
			type: 'post',
			async: false,
			success: function (html) {
				Fraym.Block.removeTabs();
				if (html.toString().length) {
					Fraym.Block.addTab(extensionJsonData.name, html);
				}

				Fraym.FileManager.initFilePathInput();

				$(Fraym.Block).trigger('blockConfigLoaded', [extensionJsonData]);
				$(Fraym.$.BLOCK_TEMPLATE_SELECTION).removeAttr('disabled');
			}
		});
	},

	deleteBlock: function (id) {
		var parentWindow = Fraym.getBaseWindow();
		var location = parentWindow.location.href.substring(parentWindow.location.protocol.length+2);
		$.ajax({
			url: Fraym.getAjaxRequestUri(),
			dataType: 'json',
			data: {cmd: 'deleteBlock', blockId: id, location: location},
			type: 'post',
			success: function (json, textStatus, jqXHR) {
				if (json.success == true) {
					$('[data-id="' + id + '"]').effect('fade', {}, 200, function () {
						$(this).remove();
					});

					$('[data-byref="' + id + '"]').effect('fade', {}, 200, function () {
						$(this).remove();
					});

					var byRefId = $('[data-id="' + id + '"]').data('byref');
					$('[data-id="' + byRefId + '"]').effect('fade', {}, 200, function () {
						$(this).remove();
					});

				} else if (typeof json.message != 'undefined') {
					Fraym.showMessage(json.message);
				}
			}
		});
	},

	copyBlock: function (id) {
		$.cookie('copy', id, { path: '/' });
		$.removeCookie('cut', { path: '/' });
		$('.block-container-actionbar, .block-holder').find('a.paste').show();
		$('.block-container-actionbar, .block-holder').find('a.pasteref').show();
	},

	cutBlock: function (id) {
		if($.cookie('cut') == id) {
			$.removeCookie('cut', { path: '/' });

			$('[data-id="' + id + '"]').css('opacity', 1);
			$('.block-container-actionbar, .block-holder').find('a.paste').hide();
		} else {
            $.cookie('cut', id, { path: '/' });
            $.removeCookie('copy', { path: '/' });

            $('[data-id="' + id + '"]').css('opacity', 0.5);
            $('.block-container-actionbar, .block-holder').find('a.paste').show();
            $('.block-container-actionbar, .block-holder').find('a.pasteref').hide();
		}
	},

	pasteBlock: function (contentId, byRef, inserAfterElement) {
		var parentWindow = Fraym.getBaseWindow();
		var id = $.cookie('copy') || $.cookie('cut');
		var op = typeof $.cookie('copy') != 'undefined' ? 'copy' : 'cut';
		var location = parentWindow.location.href.substring(parentWindow.location.protocol.length+2);

		$.ajax({
			url: Fraym.getAjaxRequestUri(),
			dataType: 'json',
			data: {cmd: 'pasteBlock', contentId: contentId, blockId: id, op: op, byRef: byRef, menuId: menu_id, location: location},
			type: 'post',
			success: function (json, textStatus, jqXHR) {

				if(op === 'cut') {
					$('.block-container-actionbar, .block-holder').find('a.paste').hide();
					$('.block-container-actionbar, .block-holder').find('a.pasteref').hide();
				}
				$.removeCookie('cut', { path: '/' });

				if (json.success == true) {
					if(op === 'cut') {
						$('[data-id="' + id + '"]').remove();
					}

					if(inserAfterElement) {
						var $blockHolder = $(json.data);
						$blockHolder.insertAfter(inserAfterElement);
						Fraym.Block.saveSorting($blockHolder);
					} else {
						$('#' + contentId).prepend(json.data);
					}

					Fraym.Block.initBlockActions();
				} else if (typeof json.message != 'undefined') {
					Fraym.showMessage(json.message);
				}
			}
		});
	},

	replaceBlock: function (blockId, data) {
		var refElementId = Fraym.getBaseWindow().$('[data-id=' + blockId + ']').attr('data-byref');

		if(refElementId) {
			var contentContainer = $(data).find('.block-container-content:first');
			Fraym.getBaseWindow().$('[data-id=' + refElementId + ']').find('.block-container-content:first').replaceWith(contentContainer);
		} else if(Fraym.getBaseWindow().$('[data-byref=' + blockId + ']').length) {
			var contentContainer = $(data).find('.block-container-content:first');
			Fraym.getBaseWindow().$('[data-byref=' + blockId + ']').find('.block-container-content:first').replaceWith(contentContainer);
		}

		Fraym.getBaseWindow().$('[data-id=' + blockId + ']').replaceWith(data);
		Fraym.getBaseWindow().Fraym.Block.initBlockActions();
	},

	addBlockActions: function (id) {
		if (id == '') {
			return;
		}

		var showPaste = !(typeof $.cookie('copy') != 'undefined' || typeof $.cookie('cut') != 'undefined');
		var showPasteRef = !(typeof $.cookie('copy') != 'undefined');

		if(showPaste !== false) {
			$('[data-id=' + id + ']').find('a.paste:first').hide();
		}

		if(showPasteRef !== false) {
			$('[data-id=' + id + ']').find('a.pasteref:first').hide();
		}

		$('[data-id=' + id + ']').find('a.paste:first').click(function(e){
			e.preventDefault();
            Fraym.Block.pasteBlock($(this).parents(Fraym.$.BLOCK_VIEW_CONTAINER).attr('id'), false, $(this).parents(Fraym.$.BLOCK_HOLDER).first());
			Fraym.Block.toggleActionBarSubmenu(e);
		});

		$('[data-id=' + id + ']').find('a.pasteref:first').click(function(e){
			e.preventDefault();
            Fraym.Block.pasteBlock($(this).parents(Fraym.$.BLOCK_VIEW_CONTAINER).attr('id'), true, $(this).parents(Fraym.$.BLOCK_HOLDER).first());
			Fraym.Block.toggleActionBarSubmenu(e);
		});

		$('[data-id=' + id + ']').find('a.add-after:first').click(function(e){
			e.preventDefault();
            Fraym.Block.showBlockDialog($(this).parents(Fraym.$.BLOCK_VIEW_CONTAINER).attr('id'), '', $(this).parents(Fraym.$.BLOCK_HOLDER).first());
			Fraym.Block.toggleActionBarSubmenu(e);
		});

		$('[data-id=' + id + ']').find('a.edit:first').click(function(e){
			e.preventDefault();
			Fraym.Block.showBlockDialog($(this).parents(Fraym.$.BLOCK_VIEW_CONTAINER).attr('id'), $(this).parents(Fraym.$.BLOCK_HOLDER).data('id'));
			Fraym.Block.toggleActionBarSubmenu(e);
		});

		$('[data-id=' + id + ']').find('a.copy:first').click(function(e){
			e.preventDefault();
			Fraym.Block.copyBlock($(this).parents(Fraym.$.BLOCK_HOLDER).data('id'));
			Fraym.Block.toggleActionBarSubmenu(e);
		});

		$('[data-id=' + id + ']').find('a.cut:first').click(function(e){
			e.preventDefault();
			Fraym.Block.cutBlock($(this).parents(Fraym.$.BLOCK_HOLDER).data('id'));
			Fraym.Block.toggleActionBarSubmenu(e);
		});

		$('[data-id=' + id + ']').find('a.delete:first').click(function(e){
			e.preventDefault();
			Fraym.Block.deleteBlock($(this).parents(Fraym.$.BLOCK_HOLDER).data('id'));
			Fraym.Block.toggleActionBarSubmenu(e);
		});
	}
};