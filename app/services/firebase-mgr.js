import Ember from 'ember';

export default Ember.Service.extend({
  buildRef(path) {
    return firebase.database().ref(path);
  }
});
