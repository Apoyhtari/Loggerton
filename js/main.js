$(document).ready(function() {

    var channelSelect = $("#select");
    var messageForm = $("#msg");
    var messageField = $("#m");

    var channelForm = $("#maker");
    var channelField = $("#newChannel")

    channelSelect.change(function() {
        var select = $(this).val();
        
        console.log('sending select with value: ' + select);
        $('#messages').html("");

        $.ajax({
            url: "/channel/" + select,
            dataType: "json",
            success: function(data) {
                console.log(data);

                var msgs = data.messages.map(function(msg) {
                    return "<li>" + msg.text + "</li>";
                });

                $("#messages").append(msgs);
            }
        });
    });

    messageForm.submit(function(e) {
        e.preventDefault();

        var $t = $(this);
        var d = {message: messageField.val()};

        messageField.val("");

        $.ajax({
            type: "post",
            url: "/channel/" + channelSelect.val(),
            data: d,
            dataType: "json",
            success: function(data) {
                if (data.success) {
                    $("#messages").append("<li>" + data.message + "</li>");
                }
            }
        });
    });

    channelForm.submit(function(e) {
        e.preventDefault();

        var d = {newChannel: channelField.val()}
        channelField.val("");

        $.ajax({
            type: "post",
            url: "/channel/",
            data: d,
            dataType: "json",
            success: function(data) {
                if (data.success) {
                    channelSelect.append("<option value='" + data.lastID + "'>" + data.name + "</option>")
                }
            }
        })
    });

});