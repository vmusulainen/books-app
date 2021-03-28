import {PaginationCounts} from '../../pagination-counts/pagination-counts';

const mergeBox = function (items, data, collectionName, publication) {
    const newItems = data.items.filter((each) => {
        return items[each.id] == null;
    });
    newItems.forEach((each) => {
        items[each.id] = each;
        each.subscriptionId = `sub-${publication._subscriptionId}`;
        publication.added(collectionName, each.id, each);
    });

    const keys = Object.keys(items).map((each) => {
        return parseInt(each);
    });
    const removedKeys = keys.filter((eachKey) => {
        return !data.items.some((eachItem) => {
            return eachItem.id === eachKey;
        });
    });

    removedKeys.forEach((each) => {
        delete items[each];
        publication.removed(collectionName, each);
    });

    const changedItems = data.items.filter((each) => {
        return items[each.id] != null;
    });
    changedItems.forEach((each) => {
        items[each.id] = each;
        each.subscriptionId = `sub-${publication._subscriptionId}`;
        publication.changed(collectionName, each.id, each);
    });

    PaginationCounts.upsert(
        {_id: `sub-${publication._subscriptionId}`},
        {
            $set: {
                page: data.page,
                page_count: data.page_count,
                per_page: data.per_page,
                total_item_count: data.total_item_count,
            },
        }
    );
};

Meteor.publish('mva.books.all', function (page, perPage) {
    const _page = page || 1;
    const _perPage = perPage || 10;
    const endpoint = `http://localhost:4000/books?page=${_page}&per_page=${_perPage}`;
    const _items = {};

    function requestToApi(endpoint, items, publication, collectionName, fetchCallback) {
        const callback = arguments[4];
        const _delay = 5000;
        fetch(endpoint)
            .then((response) => {
                console.log('response status:', response.status);
                return response.json()
            })
            .then((json) => {
                mergeBox(items, json, collectionName, publication);

                if (callback) {
                    callback();
                }
                publication.timeout = setTimeout(() => {
                    requestToApi(endpoint, items, publication, collectionName);
                }, _delay);
            });
    };

    requestToApi(endpoint, _items, this, 'books', () => {
        this.ready()
    })

    Meteor.eventBus.on('books.refresh', () => {
        console.log('on books.refresh');
        if (this.timeout != null) {
            clearTimeout(this.timeout);
        }
        requestToApi(endpoint, _items, this, 'books');
    });

    this.onStop(() => {
        console.log('on stop')
        if (this.timeout != null) {
            clearTimeout(this.timeout);
        }
    });

});
