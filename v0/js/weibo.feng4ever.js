WB2.anyWhere(function(W) {
  var statuses = {
    init: function(el, screen_name, page) {
      this.page = page
      this.screen_name = screen_name
      this.el = el;
      this.getUsers(screen_name, page)
    },
    getUsers: function(screen_name, page) {
      this.screen_name = screen_name
      if (page == 1) {
        $("#statuses").empty()
      }
      this.nextpage = page
      W.parseCMD((screen_name == 't') ? "/statuses/home_timeline.json" : "/statuses/user_timeline.json", $.proxy(function(sResult, bStatus) {
        if (bStatus == true) {
          this.page = this.nextpage

          $(sResult['statuses']).each(function() {
            $.extend({}, status).init(this).el.appendTo("#statuses")
          })

          W.widget.hoverCard({
            id: "statuses",
            search: true
          });
        }
      }, this), {
        screen_name: screen_name,
        page: page
      }, {
        method: 'get'
      });
    },
    next: function() {
      if (this.page != this.nextpage) {
        return false;
      }
      this.getUsers(this.screen_name, this.page + 1)
    }

  }
  var status = {
    init: function(data) {

      this.el = $('#status_tpl').tmpl(data);

      this.data = data
      this.el.find(".wb_comments_btn").click($.proxy(function() {
        login.check($.proxy(function() {

          this.getComments()
          this.el.find(".wb_comments").slideToggle()
        }, this))


      }, this))
      return this
    },
    getComments: function() {
      W.parseCMD("/comments/show.json", $.proxy(function(sResult, bStatus) {
        if (bStatus == true) {

          this.el.find(".wb_comments").html($.extend({}, comments).init(sResult, this).el)
          this.el.find("input")[0].focus()
          W.widget.hoverCard({
            id: "statuses",
            search: true
          });
        }
      }, this), {
        id: this.data.id
      }, {
        method: 'get'
      });


    }
  }
  var comments = {
    init: function(data, parent) {

      this.data = data
      this.parent = parent

      if (login.data) {

        data.login_screen_name = login.data.screen_name
      }
      this.el = $('#comments_show_tpl').tmpl(data)
      this.el.find("dd span a").click($.proxy(function(e) {
        this.el.find("input").val($(e.target).attr("title"))
        this.el.find("input")[0].focus()

      }, this))
      this.el.find("button").click($.proxy(function() {
        W.parseCMD("/comments/create.json", $.proxy(function(sResult, bStatus) {
          if (bStatus == true) {
            parent.getComments()
          }
        }, this), {
          id: this.parent.data.id,
          comment: this.el.find("input").val()
        }, {
          method: 'post'
        });
      }, this))
      return this
    }
  }

  var users = {
    init: function(el, screen_name) {
      this.screen_name = screen_name
      if (screen_name == 't') {
        $('#users_show').html("TIMELINE")
        return false;
      }
      this.getUsers(screen_name)
      $(document).delegate('#wb_follow_btn', "click", $.proxy(function() {

        W.parseCMD("/friendships/create.json", function(sResult, bStatus) {
          login.check(function() {
            $('#wb_follow_btn').html('已关注')
          })


        }, {
          screen_name: screen_name
        }, {
          method: 'post'
        });
      }, this))

    },
    getUsers: function(screen_name) {
      W.parseCMD("/users/show.json", function(sResult, bStatus) {
        if (bStatus == true) {
          $('#users_show').empty()

          $('#users_show_tpl').tmpl(sResult).appendTo("#users_show");

          W.widget.hoverCard({
            id: "users_show",
            search: true
          });
        }
      }, {
        screen_name: screen_name
      }, {
        method: 'get'
      });

    }

  }
  var login = {
    init: function() {

      if (this.data) {

        return false;
      }
      this.data = null
      W.widget.connectButton({
        id: "wb_connect_btn",
        type: '7,5',
        callback: {
          login: $.proxy(function(o) {
            //alert("login: "+o.screen_name)  
            this.data = o

          }, this),
          logout: function() {
            //alert('logout');
          }
        }
      });

    },
    check: function(callback) {

      if (WB2.checkLogin()) {
        callback()
      } else {
        WB2.login($.proxy(function() {


          W.widget.connectButton({
            id: "wb_connect_btn",
            type: '7,5',
            callback: {
              login: $.proxy(function(o) {
                this.data = o
                callback()
              }, this),
              logout: function() {

              }
            }
          });

        }, this))
        /*
        setTimeout(function() {
            window.location = '?'
          }, 5000)*/

      }

    }
  }
  var app = {
    init: function(el) {
      screen_name = window.location.search.replace('?', '') ? window.location.search.replace('?', '') : "feng4ever"
      login.init()
      this.referesh(screen_name)


      $(document).delegate(".nav li a", "click", $.proxy(function(e) {
        $(e.target).parent().siblings().removeClass('active')
        $(e.target).parent().addClass('active')
        if ($(e.target).parent().attr('id') == 'nav_feng4ever') {
          this.referesh('feng4ever')
        } else {
          login.check($.proxy(function() {


            screen_name = $(e.target).attr("href").replace('?', '')
            if (screen_name == 'm') {
              screen_name = login.data.screen_name
            }
            this.referesh(screen_name)


          }, this))


        }

        return false;

      }, this))
      $(document).delegate("a", "click", $.proxy(function(e) {
        if (String($(e.target).attr("href")).indexOf('http://weibo.com/n/') == 0) {
          this.referesh($(e.target).attr("href").replace('http://weibo.com/n/', ''))
          return false;
        }
      }, this))

      $(window).scroll(function() {
        if (($(window).scrollTop()) >= ($(document).height() - $(window).height()) - 200) {
          statuses.next()
        }
      })



    },
    referesh: function(screen_name) {

      statuses.getUsers(screen_name, 1)
      users.init("#users", screen_name)
      $('html, body').animate({
        scrollTop: 0
      });

    }
  }
  app.init()



})