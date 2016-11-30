import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import Ember from 'ember';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  remoteSync: Ember.inject.service(),

  actions: {
    showFulfillment(fulfillment) {
      this.transitionTo('route-plans.show.route-visits.show.fulfillments.show', fulfillment.get('id'));
    },

    async submitRouteVisit(routeVisit) {
      const fulfillments = await routeVisit.get("fulfillments");
      await Promise.all(fulfillments.map(f => f.syncDependencies()));

      routeVisit.set("routeVisitState", "fulfilled");
      routeVisit.set("completedAt", moment().toDate());

      Ember.run(() => {
        this.get("remoteSync").enqueue(routeVisit);
      });

      this.transitionTo('route-plans.show');
    },

    didTransition() {
      this.navigator.requestReverse('route-plans.show.index');
    }
  }
});
