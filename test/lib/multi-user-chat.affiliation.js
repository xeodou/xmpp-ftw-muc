'use strict';

/* jshint -W030 */

var should        = require('should')
  , MultiUserChat = require('../../index')
  , helper        = require('../helper')

describe('Affiliation updates', function() {

    var muc, socket, xmpp, manager

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
        manager = {
            socket: socket,
            client: xmpp,
            trackId: function(id, callback) {
                if (typeof id !== 'object')
                    throw new Error('Stanza ID spoofing protection not implemented')
                this.callback = callback
            },
            makeCallback: function(error, data) {
                this.callback(error, data)
            }
        }
        muc = new MultiUserChat()
        muc.init(manager)
    })

    beforeEach(function() {
        socket.removeAllListeners()
        xmpp.removeAllListeners()
        muc.init(manager)
    })

    describe('Set affilition', function() {

        beforeEach(function() {
            // Somewhere I'm not clearing a stanza listener
            // sadly this addition is required, until located
            xmpp.removeAllListeners('stanza')
        })


        it('Errors when no callback provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing callback')
                error.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.send('xmpp.muc.affiliation', {})
        })

        it('Errors when non-function callback provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing callback')
                error.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.send('xmpp.muc.affiliation', {}, true)
        })

        it('Errors if \'room\' key not provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing \'room\' key')
                error.request.should.eql(request)
                xmpp.removeAllListeners('stanza')
                done()
            }
            var request = {}
            socket.send('xmpp.muc.affiliation', request, callback)
        })

        it('Errors if \'jid\' key not provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing \'jid\' key')
                error.request.should.eql(request)
                xmpp.removeAllListeners('stanza')
                done()
            }
            var request = { room: 'fire@witches.coven.lit' }
            socket.send('xmpp.muc.affiliation', request, callback)
        })

        it('Errors if \'affiliation\' key not provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing \'affiliation\' key')
                error.request.should.eql(request)
                xmpp.removeAllListeners('stanza')
                done()
            }
            var request = {
                room: 'fire@witches.coven.lit',
                jid: 'bottom@midsummer.lit'
            }
            socket.send('xmpp.muc.affiliation', request, callback)
        })

        it('Handles error response stanza', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.is('iq').should.be.true
                stanza.attrs.type.should.equal('set')
                stanza.attrs.to.should.equal(request.room)
                should.exist(stanza.attrs.id)
                stanza.getChild('query', muc.NS_ADMIN).should.exist
                var item = stanza.getChild('query').getChild('item')
                item.attrs.affiliation.should.equal(request.affiliation)
                item.attrs.jid.should.equal(request.jid)
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
            var request = {
                room: 'fire@witches.coven.lit',
                jid: 'bottom@midsummer.lit',
                affiliation: 'outcast'
            }
            socket.send(
                'xmpp.muc.affiliation',
                request,
                callback
            )
        })

        it('Returns true on successful affiliation change', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.is('iq').should.be.true
                stanza.attrs.type.should.equal('set')
                stanza.attrs.to.should.equal(request.room)
                should.exist(stanza.attrs.id)
                stanza.getChild('query')
                    .getChild('item')
                    .getChild('reason')
                    .getText()
                    .should.equal(request.reason)
                manager.makeCallback(helper.getStanza('iq-result'))
            })
            var callback = function(error, success) {
                should.not.exist(error)
                success.should.be.true
                done()
            }
            var request = {
                room: 'fire@witches.coven.lit',
                jid: 'bottom@midsummer.lit',
                affiliation: 'outcast',
                reason: 'Making an ass of himself'
            }
            socket.send(
                'xmpp.muc.affiliation',
                request,
                callback
            )
        })
    })

})