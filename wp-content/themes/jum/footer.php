<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package WordPress
 * @subpackage Twenty_Twenty_One
 * @since Twenty Twenty-One 1.0
 */

?>
			<footer id="wn__footer" class="footer__area bg__cat--8 brown--color">
        <div class="footer-static-top">
            <div class="container">
                <div class="row">
                    <div class="col-lg-12">
                        <div class="footer__widget footer__menu">
                            <div class="ft__logo">
                                <a href="<?php echo get_site_url(); ?>">
                                    <img src="<?php echo get_field('logo','option'); ?>" alt="logo">
                                </a>
                                <p><?php echo get_field('footer_short_content','option'); ?></p>
                            </div>
                            <div class="footer__content">
                                <ul class="social__net social__net--2 d-flex justify-content-center">
                                	<?php
                                	$socials = get_field('social_media','option');
                                	if($socials){
                                		foreach($socials as $social){



                                	?>
                                    <li><a href="<?php echo $social['social_links']; ?>"><?php echo $social['social_icons']; ?></a></li>
                                    <?php
                                    }
                                	}?>
                                    <!-- <li><a href="#"><i class="bi bi-google"></i></a></li>
                                    <li><a href="#"><i class="bi bi-twitter"></i></a></li>
                                    <li><a href="#"><i class="bi bi-linkedin"></i></a></li>
                                    <li><a href="#"><i class="bi bi-youtube"></i></a></li> -->
                                </ul>
                                <ul class="mainmenu d-flex justify-content-center d-none">
                                    <li><a href="index.html">Trending</a></li>
                                    <li><a href="index.html">Best Seller</a></li>
                                    <li><a href="index.html">All Product</a></li>
                                    <li><a href="index.html">Wishlist</a></li>
                                    <li><a href="index.html">Blog</a></li>
                                    <li><a href="index.html">Contact</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="copyright__wrapper">
            <div class="container">
                <div class="row">
                    <div class="col-lg-6 col-md-6 col-sm-12">
                        <div class="copyright">
                            <div class="copy__right__inner text-start">
                                <p>&copy; <?php echo date('Y'); ?> copyright. Made with <i class="fa fa-heart text-danger"></i> by <a
                                        href="https://webart.technology/" target="_blank">Webart technology</a></p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 col-md-6 col-sm-12">
                        <!-- <div class="payment text-end">
                            <img src="images/icons/payment.png" alt=""/>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>
    </footer>
    <!-- JS Files -->
<script src="<?php echo get_template_directory_uri(); ?>/js/vendor/jquery.min.js"></script>
<script src="<?php echo get_template_directory_uri(); ?>/js/popper.min.js"></script>
<script src="<?php echo get_template_directory_uri(); ?>/js/vendor/bootstrap.min.js"></script>
<script src="<?php echo get_template_directory_uri(); ?>/js/plugins.js"></script>
<script src="<?php echo get_template_directory_uri(); ?>/js/active.js"></script>



<?php wp_footer(); ?>

</body>
</html>
