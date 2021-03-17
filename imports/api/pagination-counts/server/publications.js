import {PaginationCounts} from '../pagination-counts';

Meteor.publish('pagination-counts.subscription', function (subscriptionId) {
    return PaginationCounts.find({_id: subscriptionId});
});