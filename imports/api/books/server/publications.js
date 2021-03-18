import EventBus from 'js-event-bus';

import { PaginationCounts } from '../../pagination-counts/pagination-counts';

const eventBus = new EventBus();

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
        { _id: `sub-${publication._subscriptionId}` },
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

Meteor.publish('books.all', function (page, perPage) {
    const collectionName = 'books';
    let startsCount = 0;
    let isPublishStop = false;
    const endpoint = `http://localhost:4000/books?page=${page}&per_page=${perPage}`;
    const items = {};
    const getBooks = async (isRecursive = true) => {
        try {
            if (isPublishStop) {
                return;
            }
            const response = await fetch(endpoint);
            if (response.status == 502) {
                await getBooks();
            } else if (response.status != 200) {
                console.log(response.statusText);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await getBooks();
            } else {
                console.log('Timer: refreshing data');
                const data = await response.json();
                mergeBox(items, data, collectionName, this);
                await new Promise((resolve) => setTimeout(resolve, 10000));
                if (startsCount === 0) {
                    this.ready();
                }
                if (isRecursive) {
                    startsCount += 1;
                    console.log('startCount', startsCount);
                    await getBooks();
                }
            }
        } catch (error) {
            console.log('ErrOR', error);
        }
    };

    getBooks(true);
    const eventCallback = () => {
        getBooks(false);
    };
    eventBus.on('books.refresh', eventCallback);

    this.onStop(() => {
        isPublishStop = true;
        eventBus.detach('books.refresh', eventCallback);
        PaginationCounts.remove({ _id: `sub-${this._subscriptionId}` });
    });

    this.ready();
});

Meteor.methods({
    'books.create'(data) {
        fetch('http://localhost:4000/books', {
            method: 'post',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                eventBus.emit('books.refresh');
            });
    },
    'books.delete'(id) {
        fetch(`http://localhost:4000/books/${id}`, {
            method: 'delete',
            //            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                eventBus.emit('books.refresh');
            });
    },
    'books.update'({ id, data }) {
        fetch('http://localhost:4000/books/' + id, {
            method: 'put',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                eventBus.emit('books.refresh', json);
            });
    },
});
