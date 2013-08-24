var should        = require('should')
  , MultiUserChat = require('../../lib/multi-user-chat')
  , ltx           = require('ltx')
  , helper        = require('../helper')
  , xhtmlIm       = require('xmpp-ftw/lib/utils/xep-0071')
  , chatState     = require('xmpp-ftw/lib/utils/xep-0085')

describe('Room configuration', function() {

    var muc, socket, xmpp, manager

    before(function() {
        socket = new helper.Eventer()
        xmpp = new helper.Eventer()
        manager = {
            socket: socket,
            client: xmpp,
            trackId: function(id, callback) {
                this.callback = callback
            },
            makeCallback: function(error, data) {
                this.callback(error, data)
            }
        }
        muc = new MultiUserChat()
        muc.init(manager)
    })

    describe('Get configuration', function() {

        it('Errors when no callback provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal("Missing callback")
                error.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.emit('xmpp.muc.room.config.get', {})
        })

        it('Errors when non-function callback provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal("Missing callback")
                error.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.emit('xmpp.muc.room.config.get', {}, true)
        })

        it('Errors if \'room\' key missing', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal("Missing 'room' key")
                error.request.should.eql(request)
                xmpp.removeAllListeners('stanza')
                done()
            }
            var request = {}
            socket.emit('xmpp.muc.room.config.get', request, callback)
        })

        it('Handles error response stanza', function(done) {
            var room = 'fire@coven.witches.lit'
            xmpp.once('stanza', function(stanza) {
                 stanza.is('iq').should.be.true
                 stanza.attrs.type.should.equal('get')
                 stanza.attrs.to.should.equal(room)
                 should.exist(stanza.attrs.id)
                 stanza.getChild('query', muc.NS_OWNER).should.exist
                 manager.makeCallback(helper.getStanza('iq-error'))
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.should.eql({
                    type: 'cancel',
                    condition: 'error-condition'
                })
                done()
            }
            socket.emit(
                'xmpp.muc.room.config.get',
                { room: room },
                callback
            )
        })

        it('Returns room configuration', function(done) {
            var room = 'fire@coven.witches.lit'
            xmpp.once('stanza', function(stanza) {
                 stanza.is('iq').should.be.true
                 stanza.attrs.type.should.equal('get')
                 stanza.attrs.to.should.equal(room)
                 should.exist(stanza.attrs.id)
                 stanza.getChild('query', muc.NS_OWNER).should.exist
                 manager.makeCallback(helper.getStanza('config-get-result'))
            })
            var callback = function(error, data) {
                should.not.exist(error)
                data.title.should.equal('Configuration for "fire" Room')
                data.instructions.should.equal(
                    'Use this form to update room configuration'
                )
                data.fields.length.should.equal(1)
                data.fields[0].label
                    .should.equal('Short Description of Room')
                data.fields[0].type = 'text-single'
                data.fields[0].var = 'muc#roomconfig_roomdesc'
                data.fields[0].value = 'Come chat around the fire'
                data.fields[0].required.should.equal.false
                done()
            }
            socket.emit(
                'xmpp.muc.room.config.get',
                { room: room },
                callback
            )
        })
    })

    describe('Set configuration', function() {

        it('Errors when no callback provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal("Missing callback")
                error.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.emit('xmpp.muc.room.config.set', {})
        })

        it('Errors when non-function callback provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal("Missing callback")
                error.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.emit('xmpp.muc.room.config.set', {}, true)
        })

        it('Errors if \'room\' key missing', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal("Missing 'room' key")
                error.request.should.eql(request)
                xmpp.removeAllListeners('stanza')
                done()
            }
            var request = {}
            socket.emit('xmpp.muc.room.config.set', request, callback)
        })

        it('Errors if \'form\' key missing', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal("Missing 'form' key")
                error.request.should.eql(request)
                xmpp.removeAllListeners('stanza')
                done()
            }
            var request = { room: 'fire@witches.coven.lit' }
            socket.emit('xmpp.muc.room.config.set', request, callback)
        })

        it('Handles invalid data form', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal("Badly formatted data form")
                error.request.should.eql(request)
                xmpp.removeAllListeners('stanza')
                done()
            }
            var request = { room: 'fire@witches.coven.lit', form: true }
            socket.emit('xmpp.muc.room.config.set', request, callback)
        })

        it('Handles error response stanza', function(done) {
            var room = 'fire@coven.witches.lit'
            xmpp.once('stanza', function(stanza) {
                 stanza.is('iq').should.be.true
                 stanza.attrs.type.should.equal('set')
                 stanza.attrs.to.should.equal(room)
                 should.exist(stanza.attrs.id)
                 stanza.getChild('query', muc.NS_OWNER).should.exist
                 manager.makeCallback(helper.getStanza('iq-error'))
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.should.eql({
                    type: 'cancel',
                    condition: 'error-condition'
                })
                done()
            }
            socket.emit(
                'xmpp.muc.room.config.set',
                { room: room, form: [] },
                callback
            )
        })

        it('Allows setting of room configuration', function(done) {
            var request = {
                room: 'fire@coven.witches.lit',
                form: []
            }
            xmpp.once('stanza', function(stanza) {
                 stanza.is('iq').should.be.true
                 stanza.attrs.type.should.equal('set')
                 stanza.attrs.to.should.equal(request.room)
                 should.exist(stanza.attrs.id)
                 stanza.getChild('query', muc.NS_OWNER).should.exist
                 var x = stanza.getChild('query').getChild('x')
                 x.attrs.xmlns.should.equal('jabber:x:data')
                 x.attrs.type.should.equal('submit')
                 x.children.length.should.equal(1)
                 x.children[0].attrs.var.should.equal('FORM_TYPE')
                 x.children[0].getChild('value').getText()
                     .should.equal(muc.NS_CONFIG)
                 manager.makeCallback(helper.getStanza('iq-result'))
            })
            var callback = function(error, data) {
                should.not.exist(error)
                data.should.be.true
                done()
            }
            socket.emit(
                'xmpp.muc.room.config.set',
                request,
                callback
            )
        })

    })

})