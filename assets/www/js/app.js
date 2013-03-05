//set some defaults before the app loads
$(document).on("mobileinit", function () {
    $.mobile.pageContainer = $('#container');
    $.mobile.defaultPageTransition = 'none';
    $.mobile.defaultDialogTransition = 'none';
    $.mobile.buttonMarkup.hoverDelay = 0;
});

jQuery(function ($) {
var App = {
    init: function(){
        this.apiURL = 'http://securitysystem.herokuapp.com';
        this.oldKey = "";
        this.sensors = [];
        this.cacheElements();
        this.bindEvents();
        this.fetchSensors();
    },
    cacheElements: function(){
        this.listTemplate = Handlebars.templates.sensor;
        this.viewTemplate = Handlebars.templates.sensorview;
        this.$listPage = $('div#sensorpage');
        this.$addPage = $('div#add');
        this.$editPage = $('div#edit');
        this.$newSensorKey = $('#new-sensor-key');
        this.$newSensorName = $('#new-sensor-name');
        this.$editSensorKey = $('#edit-sensor-key');
        this.$editSensorName = $('#edit-sensor-name');
        this.$sensorList = $('#sensorlist');
        this.$viewWindow = $('#inner-view');
    },
    bindEvents: function(){
        this.$sensorList.on('click', '.view-button', this.viewSensor);
        this.$sensorList.on('click', '.edit-gear', this.editSensor);
        this.$listPage.on('click','#refresh-button', this.fetchSensors);
        this.$addPage.on('click','input#add-button', this.submitAdd);
        this.$editPage.on('click','input#submit-button', this.submitEdit);
        this.$editPage.on('click', '#delete-sensor-button', this.submitDelete);
        this.$listPage.on('click', '.view-sensor-save', this.submitSave);
        this.$listPage.on('click', '.reset-button', this.resetSensor);
        this.$listPage.on('slidestop', '.view-sensor-enabled', this.enableDisable);
        this.$listPage.on('pageshow', this.pageShow);
    },
    pageShow: function(){
        App.fetchSensors();
    },
    fetchSensors: function(){
        try{
            $.mobile.loading('show');
            $.getJSON(App.apiURL+'/sensors.json', function(data){
                App.sensors = data;
                App.refreshSensorList();
                $.mobile.loading('hide');
                return false;
            });
        }
        catch(error){
            alert("Couldn't get the sensor list!"+error);
        }
    },
    refreshSensorList: function(){
        App.$sensorList.html(App.listTemplate(App.sensors));
        App.$sensorList.trigger('create');
        App.$sensorList.listview('refresh');
        return false;
    },
    refreshSensorView: function(i,sensor){
        this.$viewWindow.html(this.viewTemplate(sensor)).trigger('create');
        return false;
    },
    viewSensor: function(){
        App.getSensor(this,App.refreshSensorView);
    },
    getSensor: function(elem, callback){
        var id = $(elem).closest('li').data('sensorid');
        $.each(App.sensors, function (i, sens) {
            if (sens.sensor.sensor_id == id) {
                callback.apply(App, arguments);
                return false;
            }
        });
    },
    submitAdd: function(event){
        event.preventDefault();
        var pushID = "";
        var name = App.$newSensorName.val();
        var id = App.$newSensorKey.val();
        try{
            pushID = window.getAPID.getAPID();
        } catch(err){
            console.log("Couldn't get APID!\n"+err);
        }
        $.ajax({
            type: "POST",
            url: App.apiURL+"/sensors/",
            data: {sensor: { name:name, sensor_id:id, enabled:true, tripped:false, client_apid:pushID }}
        }).done(function() {
            App.$newSensorName.val('');
            App.$newSensorKey.val('');
            window.history.back();
            App.fetchSensors();
        });
    },
    editSensor: function() {
        App.getSensor(this,function(i,sensor){
            App.$editSensorName.val(sensor.sensor.name);
            App.$editSensorKey.val(sensor.sensor.sensor_id);
            App.oldKey = sensor.sensor.sensor_id;
        });
    },
    submitEdit: function(event){
        event.preventDefault();
        $.ajax({
            type: "PUT",
            url: App.apiURL+"/sensors/"+App.oldKey,
            data: {sensor: { name:App.$editSensorName.val(), sensor_id:App.$editSensorKey.val() }}
        }).done(function(){
                window.history.back();
                App.fetchSensors();
            });
    },
    submitDelete: function(){
        $.ajax({
            type: "DELETE",
            url: App.apiURL+"/sensors/"+App.oldKey
        }).done(function() {
            App.fetchSensors();
        });
    },
    submitSave: function(event){
        var img = $(this).parent().parent().find('.view-sensor-tripped-img');
        var tripped = $(this).parent().parent().find('.view-sensor-tripped');
        var enabled = $(this).parent().parent().find('.view-sensor-enabled');
        var tripped_bool = tripped.text() == "TRIPPED";
        $.ajax({
            type: "PUT",
            url: App.apiURL+"/sensors/"+$('span.view-sensor-key').text(),
            data: {sensor: { enabled: enabled.val(), tripped: tripped_bool }}
        }).done(function(){
                App.fetchSensors();
        });
    },
    resetSensor: function(){
        var img = $(this).parent().parent().find('.view-sensor-tripped-img');
        var tripped = $(this).parent().parent().find('.view-sensor-tripped');
        var enabled = $(this).parent().parent().find('.view-sensor-enabled');

        if(enabled.val() == 'on'){
            img.attr('src', 'img/check.png');
            tripped.text("Ready");
        }
        else{
            img.attr('src', 'img/disabled.png');
            tripped.text("Disabled");
        }
        return false;
    },
    enableDisable: function(){
        var img = $(this).parent().parent().find('.view-sensor-tripped-img');
        var tripped = $(this).parent().parent().find('.view-sensor-tripped');
        var enabled = $(this).parent().parent().find('.view-sensor-enabled');

        if(enabled.val() == 'on'){
            if(tripped.text() == "TRIPPED"){
                img.attr('src', 'img/danger.png');
                tripped.text("TRIPPED");
            }
            else{
                img.attr('src', 'img/check.png');
                tripped.text("Ready");
            }
        }
        else {
            img.attr('src', 'img/disabled.png');
            tripped.text("Disabled");
        }
        return false;
    }
};

    App.init();

});


