import '../../api/books/server/publications';
import '../../api/books/server/publications-mva';
import '../../api/pagination-counts/server/publications';

import EventBus from 'js-event-bus';

Meteor.eventBus = new EventBus();
