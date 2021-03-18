import EventBus from 'js-event-bus';

import {PaginationCounts} from '../../pagination-counts/pagination-counts';

const eventBus = new EventBus();

const mergeBox = function (items, data, collectionName, publication) {
    console.log('data', data)
    const newItems = data.items.filter((each) => {
        return items[each.id] == null
    });
    newItems.forEach((each) => {
        items[each.id] = each;
        publication.added(collectionName, each.id, each);
    });

    const changedItems = data.items.filter((each) => {
        return items[each.id] != null
    });
    changedItems.forEach((each) => {
        items[each.id] = each;
        publication.changed(collectionName, each.id, each);
    });

    PaginationCounts.upsert({_id: `sub-${publication._subscriptionId}`}, {
        $set: {
            page: data.page,
            page_count: data.page_count,
            per_page: data.per_page,
            total_item_count: data.total_item_count
        }
    });


}


Meteor.publish('books.all', function (page, perPage) {
    const collectionName = 'books';
    const endpoint = `http://localhost:4000/books?page=${page}&per_page=${perPage}`;
    const items = {};
    //the first adding all fetched items to local store
    fetch(endpoint)
        .then((res) => {
            return res.json();
        })
        .then((json) => {
            console.log(json);
            mergeBox(items, json, collectionName, this);
        });


    const timeInterval = Meteor.setInterval(() => {
        fetch(endpoint)
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                console.log(json);
                mergeBox(items, json, collectionName, this);
            });
    }, 10000);

    const eventCallback = () => {
        console.log('event callback')
        fetch(endpoint)
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                mergeBox(items, json, collectionName, this);
            });
    }

    eventBus.on('books.create', eventCallback);

    this.onStop(() => {
        console.log('on publications stopped');
        eventBus.detach('books.create', eventCallback);
        Meteor.clearInterval(timeInterval);
        PaginationCounts.remove({_id: `sub-${this._subscriptionId}`});
    })

    this.ready();


})

Meteor.methods({
    'books.create'(data) {
        fetch('http://localhost:4000/books', {
            method: 'post',
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json'},
        })
            .then((res) => {
                return res.json()
            })
            .then((json) => {
                eventBus.emit('books.create');
            });
    }

});






















