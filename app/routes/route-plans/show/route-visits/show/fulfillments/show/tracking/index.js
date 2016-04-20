import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import Ember from 'ember';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  model() {
    const fulfillment = this.modelFor('route-plans.show.route-visits.show.fulfillments.show');
    this._prepStock(fulfillment);
    this._prepCreditNote(fulfillment);

    return fulfillment;
  },

  _prepStock(fulfillment) {
    const itemDesires = fulfillment.get('routeVisit.visitWindow.location.itemDesires');

    if(fulfillment.belongsTo('stock').value()) {
      const stock = fulfillment.get('stock');
      const missingItemDesires = itemDesires
        .filter(itemDesire => itemDesires.get('enabled'))
        .filter(itemDesire =>
          !stock.get('stockLevels')
            .find(sl => sl.get('item.id') === itemDesire.get('item.id')));

      missingItemDesires
        .forEach(itemDesire => this.store.createRecord('stock-level', {stock, item:itemDesire.get('item')}));

    } else {
      const location = fulfillment.get('routeVisit.visitWindow.location');
      const stock = this.store.createRecord('stock', {fulfillment, location});

      itemDesires
        .filter(itemDesire => itemDesire.get('enabled'))
        .forEach(itemDesire => this.store.createRecord('stock-level', {stock, item: itemDesire.get('item')}));
    }
  },

  _prepCreditNote(fulfillment) {
    const itemDesires = fulfillment.get('routeVisit.visitWindow.location.itemDesires');

    if(fulfillment.belongsTo('creditNote').value()) {
      const creditNote = fulfillment.get('creditNote');
      const missingItemDesires = itemDesires
        .filter(itemDesire => itemDesires.get('enabled'))
        .filter(itemDesire => !creditNote.get('creditNoteItems')
          .find(creditNoteItem => creditNoteItem.get('item.id') === itemDesire.get('item.id')));

      missingItemDesires
        .forEach(itemDesire => this._createCreditNoteItem(creditNote, itemDesire.get('item')));

    } else {
      const location = fulfillment.get('routeVisit.visitWindow.location');
      const creditNote = this.store.createRecord('creditNote', {fulfillment, location});
      itemDesires
        .filter(itemDesire => itemDesire.get('enabled'))
        .forEach(itemDesire => this._createCreditNoteItem(creditNote, itemDesire.get('item')));
    }
  },

  _createCreditNoteItem(creditNote, item) {
    this.store.createRecord('credit-note-item', {creditNote, item, unitPrice:10});
  },

  actions: {
    trackItem(dto) {
      this.transitionTo('route-plans.show.route-visits.show.fulfillments.show.tracking.item', dto.stockLevel.get('item.id'));
    },

    markAllCompleted() {
      const fulfillment = this.modelFor('route-plans.show.route-visits.show.fulfillments.show');
      fulfillment.get('stock.stockLevels')
        .forEach(sl => sl.set('locallyCompleted', true));

      fulfillment.get('creditNote.creditNoteItems')
        .forEach(cni => cni.set('locallyCompleted', true));

      this.transitionTo('route-plans.show.route-visits.show.fulfillments.show');
    },

    didTransition() {
      this.navigator.requestReverse('route-plans.show.route-visits.show.fulfillments.show');

      const model = this.modelFor('route-plans.show.route-visits.show.fulfillments.show');

      this.stateInfo.display({
        label:model.get('order.location.name'),
        info:model.get('order.location.code')
      });
    }
  }
});
