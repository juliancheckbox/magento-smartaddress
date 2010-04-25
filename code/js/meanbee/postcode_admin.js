/*
 * Meanbee_SmartAddress
 *
 * This module was developed by Meanbee Internet Solutions Limited.  If you require any
 * support or have any questions please contact us at support@meanbee.com.
 *
 * @category   Meanbee
 * @package    Meanbee_SmartAddress
 * @author     Meanbee Internet Solutions Limited <support@meanbee.com>
 * @copyright  Copyright (c) 2010 Meanbee Internet Solutions Limited (http://www.meanbee.com)
 * @license    Single Site License, requiring consent from Meanbee Internet Solutions Limited
 */

var street_id;

function getStreet(element, entry) {
    return entry + "&street_id=" + street_id;
} 

function getCountryAndPostcodeBilling(element, entry) {
    return entry + '&country=' + $F('billing:country_id') 
                + '&postcode=' + $F('billing:postcode');
}

function getCountryAndPostcodeShipping(element, entry) {
    return entry + '&country=' + $F('shipping:country_id')
                + '&postcode=' + $F('shipping:postcode');
}

function showCorrectTextBoxes(a) {
    var country = $F(a + ':country_id');

    if (country == 'GB') {
        $('meanbee:' + a + '_address_find').show();
        $('meanbee:' + a + '_address_selector').show();
        $('meanbee:' + a + '_street').hide();
        $('meanbee:' + a + '_building').hide();
        $('meanbee_smart_address_info_' + a).innerHTML = "Make things easy with our Address Finder!<br/>Enter your postcode and click the 'Find Address' button.";
    } else if (country == 'US') {
        $('meanbee:' + a + '_address_find').hide();
        $('meanbee:' + a + '_address_selector').hide();
        $('meanbee:' + a + '_street').show();
        $('meanbee:' + a + '_building').show();
        $('meanbee_smart_address_info_' + a).innerHTML = "Make things easy with our Address Finder!<br/>Enter your zipcode and then start typing your street and building to autocomplete your address.";
    } else {
        $('meanbee:' + a + '_address_find').hide();
        $('meanbee:' + a + '_address_selector').hide();
        $('meanbee:' + a + '_street').show();
        $('meanbee:' + a + '_building').hide();
        $('meanbee_smart_address_info_' + a).innerHTML = "Make things easy with our Address Finder!<br/>Enter your postcode and then start typing your street to autocomplete your address.";
    }
}

function postcode_observe(a) {
    showCorrectTextBoxes(a);

    // Observe user changing the country field
    $(a + ':country_id').observe('change', function (e) {
        showCorrectTextBoxes(a);
    });

    // Show autocomplete drop downs when field is active, hide if not.
    $('meanbee:' + a + '_autocomplete').observe('focus',function (e) {
        if ($('autocomplete_choices_' + a + '_street').children.length > 0) {
            $('autocomplete_choices_' + a + '_street').setStyle({display:'block'});
        }
    });

    $('meanbee:' + a + '_autocomplete').observe('blur',function (e) {
        $('autocomplete_choices_' + a + '_street').setStyle({display:'hidden'});
    });

    $('meanbee:' + a + '_autocomplete_building').observe('focus',function (e) {
        if ($('autocomplete_choices_' + a + '_building').children.length > 0) {
            $('autocomplete_choices_' + a + '_building').setStyle({display:'block'});
        }
    });     
    
    $('meanbee:' + a + '_autocomplete_building').observe('blur',function (e) {
        $('autocomplete_choices_' + a + '_building').setStyle({display:'hidden'});
    }); 

    // Listen for the UK find address button being clicked
    $('meanbee:' + a + '_address_find').observe('click', function (e) { 
        var postcode = $F(a + ':postcode');
        if (postcode != '') { 
            $('meanbee:' + a + '_address_selector').innerHTML = "Loading..."; 
            postcode_fetchOptionsUK(postcode, a); 
        } 
    }); 
}


function postcode_fetchOptionsUK(p, a) {
    new Ajax.Request(BASE_URL + 'postcode/finder/multiple/', {
        method: 'get',
        parameters: 'postcode=' + p
                    + '&country=GB',
        onSuccess: function(t) {
            var j = t.responseJSON;

            if (!j.error) {
                var c = '<select id="meanbee:' + a + '_address_selector_select">';
                for(var i = 0; i < j.content.length; i++) {
                    c += '<option value="' + j.content[i].id + '">' + j.content[i].description + '</option>'
                }
                c+= '</select>';
                $('meanbee:' + a + '_address_selector').innerHTML = c + ' <button onclick="postcode_fillFields($F(\'meanbee:' + a + '_address_selector_select\'), $F(\'' + a + ':country_id\'), \'' + a + '\' )" type="button" class="button"><span><span>Select Address</span></span></button>';
                //$('meanbee:' + a + '_address_selector').innerHTML += '<br /><small><b>Note:</b> Please select your address from the above drop down menu before pressing "Select Address".</small>';
            } else {
                postcode_error(j.content, a);
            }
        }
    });
}

function postcode_autocomplete_selected(text,li) {
    var formName;
    var country;
   
    if (text.id == 'meanbee:billing_autocomplete') {
        formName = 'billing';
        country =  $F('billing:country_id');
    } else if (text.id == 'meanbee:shipping_autocomplete') {
        formName = 'shipping';
        country = $F('shipping:country_id');
    }   
    
    if ( country == 'US' ) { 
        street_id = li.id;
    } else {
        postcode_fillFieldsWorld(li.id, country, formName);
    }   
}

function postcode_autocomplete_building(text,li) {
    var formName;
    var country;
   
    if (text.id == 'meanbee:billing_autocomplete_building') {
        formName = 'billing';
        country =  $F('billing:country_id');
    } else if (text.id == 'meanbee:shipping_autocomplete_building') {
        formName = 'shipping';
        country = $F('shipping:country_id');
    }   

    postcode_fillFieldsUS(li.id, country, formName);
}

function postcode_fillFields(id, country, a) {                
    new Ajax.Request(BASE_URL + 'postcode/finder/single/', {
        method: 'get',
        parameters: 'id=' + id +
                    '&country=' + country,
        onSuccess: function(t) {
            var j = t.responseJSON;
            var field_prefix = 'order-' + a + '_address_';            

            if (!j.error) {
                var lines = new Array(j.content.line1, j.content.line2, j.content.line3, j.content.line4, j.content.line5);
                var concat_line = null;

                $(field_prefix + 'country_id').value = 'GB';

                for (var i = 0; i < 4; i++) {
                    if (typeof(lines[i]) != "undefined" &&  $(field_prefix + 'street' + i) != null) {
                        $(field_prefix + 'street' + i).value = lines[i];
                    } else if ($(field_prefix + 'street' + i) != null) {
                        $(field_prefix + 'street' + i).value = '';
                    } else if (typeof(lines[i]) != "undefined") {
                        if (concat_line == null) {
                            concat_line = i - 1;
                        }

                        $(field_prefix + 'street' + concat_line).value += ', ' + lines[i];
                    }
                }        

                if (typeof(j.content.organisation_name) != "undefined") {
                    $(field_prefix + 'company').value = j.content.organisation_name;
                } else {
                    $(field_prefix + 'company').value = '';
                }
                
                if (typeof(j.content.post_town) != "undefined") {
                    $(field_prefix + 'city').value = j.content.post_town;
                } else {
                    $(field_prefix + 'city').value = '';
                }
                
                if (typeof(j.content.county) != "undefined") {
                    $(field_prefix + 'region').value = j.content.county;
                } else {
                    $(field_prefix + 'region').value = '';
                }
                
                $(field_prefix + 'postcode').value = j.content.postcode;

                $('meanbee:' + a + '_address_selector').innerHTML = '&nbsp;';
            } else {
                postcode_error(j.content, a);
            }
        }
    });
}

function postcode_fillFieldsUS(id, country, a) {
new Ajax.Request(BASE_URL + 'postcode/finder/single/', {
        method: 'get',
        parameters: 'id=' + id +
                    '&country=' + country,
        onSuccess: function(t) {
            var j = t.responseJSON;
            var field_prefix = 'order-' + a + '_address_';
            
            if (!j.error) {
                var lines = new Array(j.content.line1, j.content.line2);
                var concat_line = null;

                $(field_prefix + 'country_id').value = 'US';

                for (var i = 0; i < 2; i++) {
                    if (typeof(lines[i]) != "undefined" &&  $(field_prefix + 'street' + i) != null) {
                        $(field_prefix + 'street' + i).value = lines[i];
                    } else if ($(field_prefix + 'street' + i) != null) {
                        $(field_prefix + 'street' + i).value = '';
                    } else if (typeof(lines[i]) != "undefined") {
                        if (concat_line == null) {
                            concat_line = i - 1;
                        }

                        $(field_prefix + 'street' + concat_line).value += ', ' + lines[i];
                    }
                }       

                if (typeof(j.content.organisation_name) != "undefined") {
                    $(field_prefix + 'company').value = j.content.organisation_name;
                } else {
                    $(field_prefix + 'company').value = '';
                }
                
                if (typeof(j.content.city) != "undefined") {
                    $(field_prefix + 'city').value = j.content.city;
                } else {
                    $(field_prefix + 'city').value = '';
                }

                if (typeof(j.content.state) != "undefined") {
                    for (region in countryRegions['US']) {
                        if (countryRegions['US'][region].code == j.content.state) {
                            $(field_prefix + 'region_id').value = region;
                        }
                    }
                } else {
                    $(field_prefix + 'region').value = '';
                }

                $(field_prefix + 'postcode').value = j.content.zip;

            } else {
                alert(j.content);
            }
        }
    });
}

function postcode_fillFieldsWorld(id, country, a) {
new Ajax.Request(BASE_URL + 'postcode/finder/single/', {
        method: 'get',
        parameters: 'id=' + id +
                    '&country=' + country,
        onSuccess: function(t) {
            var j = t.responseJSON;
            var field_prefix = 'order-' + a + '_address_';

            if (!j.error) {
                var lines = new Array(j.content.street, j.content.district);
                var concat_line = null;
                
                for (var i = 0; i < 2; i++) {
                    if (typeof(lines[i]) != "undefined" &&  $(field_prefix + 'street' + i) != null) {
                        $(field_prefix + 'street' + i).value = lines[i];
                    } else if ($(field_prefix + 'street' + i) != null) {
                        $(field_prefix + 'street' + i).value = ''; 
                    } else if (typeof(lines[i]) != "undefined") {
                        if (concat_line == null) {
                            concat_line = i - 1;
                        }

                        $(field_prefix + 'street' + concat_line).value += ', ' + lines[i];
                    }
                } 

                if (typeof(j.content.city) != "undefined") {
                    $(field_prefix + 'city').value = j.content.city;
                } else {
                    $(field_prefix + 'city').value = '';
                }
                
                if (typeof(j.content.state) != "undefined") {
                    var county_done = false;

                    for (country_item in countryRegions) {
                        if (country_item == country) {
                            for (region in countryRegions[country]) {
                                if (countryRegions[country][region].code == j.content.state) {
                                    $(field_prefix + 'region_id').value = region;
                                    county_done = true;
                                }
                            }
                        }
                    }

                    if (!county_done) {
                        $(field_prefix + 'region').value = j.content.state;
                    }
                } else {
                    $(field_prefix + 'region').value = '';
                }
                
                $(field_prefix + 'postcode').value = j.content.postcode;

            } else {
                alert(j.content);
            }
        }
    });
}

function postcode_error(m, a) {
    $('meanbee:' + a + '_address_selector').innerHTML = '&nbsp;';
    alert(m);
}
