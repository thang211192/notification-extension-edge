import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

function setup() {
  class Element {
    children = []; style = {}; events = {}; parent = null;
    get isConnected() { return this === document.documentElement || Boolean(this.parent?.isConnected); }
    append(...items) { for (const item of items) { item.parent = this; this.children.push(item); } }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); this.parent = null; }
    attachShadow() { this.shadow = new Element(); this.shadow.parent = this; return this.shadow; }
    setAttribute() {}
    addEventListener(name, fn) { this.events[name] = fn; }
    contains(item) { return item === this || this.children.some(child => child.contains(item)); }
  }
  const document = { visibilityState: 'visible', createElement: () => new Element(), documentElement: new Element() };
  const timers = new Map(); let now = 0, next = 0, onMessage, onChanged, sent = 0;
  const context = {
    document,
    setTimeout(fn, ms) { timers.set(++next, {fn,when:now+ms}); return next; },
    clearTimeout(id) { timers.delete(id); },
    chrome: {
      runtime: {id:'mam',onMessage:{addListener(fn){onMessage=fn;}},sendMessage(){sent++;}},
      storage: {onChanged:{addListener(fn){onChanged=fn;}}}
    }
  };
  vm.runInNewContext(fs.readFileSync(new URL('../reminder.js',import.meta.url),'utf8'),context);
  return {
    document, timers, get sent(){return sent;},
    show(kind='water',test=false) { onMessage({type:'mam-reminder',kind,test},{id:'mam'},()=>{}); return document.documentElement.children[0].shadow.children.at(-1); },
    tick(ms) { now+=ms; for(const [id,timer] of [...timers]) if(timer.when<=now) {timers.delete(id);timer.fn();} },
    disable() { onChanged({settings:{newValue:{inPageEnabled:false}}},'local'); }
  };
}
test('normal and preview cards close after 10 seconds without recording activity', () => {
  for (const preview of [false,true]) {
    const app=setup(); app.show('water',preview); app.tick(9999);
    assert.equal(app.document.documentElement.children.length,1);
    app.tick(1); assert.equal(app.document.documentElement.children.length,0);
    assert.equal(app.sent,0);
  }
});
test('hover and keyboard focus hold the card, then restart its timeout', () => {
  const app=setup(), card=app.show();
  card.events.mouseenter(); app.tick(20000); assert.ok(card.isConnected);
  card.events.focusin(); card.events.mouseleave(); app.tick(20000); assert.ok(card.isConnected);
  card.events.focusout({relatedTarget:null}); app.tick(9999); assert.ok(card.isConnected);
  app.tick(1); assert.ok(!card.isConnected);
});
test('replacement and simultaneous reminders have independent timers; disabling cleans up', () => {
  const app=setup(); const first=app.show(); app.tick(5000);
  const replacement=app.show(); const stretch=app.show('stretch');
  assert.ok(!first.isConnected); app.tick(5000);
  assert.ok(replacement.isConnected); assert.ok(stretch.isConnected);
  app.tick(5000); assert.equal(app.document.documentElement.children.length,0);
  app.show(); app.show('stretch'); app.disable();
  assert.equal(app.timers.size,0); assert.equal(app.document.documentElement.children.length,0);
});
