import { PaginationCounts } from '../../pagination-counts/pagination-counts';

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

async function getData(endpoint) {
    try {
        const response = await fetch(endpoint);

        if (response.status === 200) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        throw '[Poll] ' + error;
    }
}

function poll(timer, func) {
    const interval = setInterval(func, timer);
    return () => {
        clearInterval(interval);
    };
}

Meteor.publish('books.all', function (page, perPage) {
    const timer = 5 * 1000;
    const collectionName = 'books';
    const _page = page || 1;
    const _perPage = perPage || 10;
    const endpoint = `http://localhost:4000/books?page=${_page}&per_page=${_perPage}`;
    const items = {};

    const getBooks = async () => {
        console.log('Timer publication');
        const data = await getData(endpoint);
        mergeBox(items, data, collectionName, this);
    };

    getBooks().then(() => {
        this.ready();
    });

    const stopPoll = poll(timer, getBooks);

    Meteor.eventBus.on('books.refresh', getBooks);

    this.onStop(() => {
        stopPoll();
        console.log('on publications stopped');
        eventBus.detach('books.refresh', getBooks);
        PaginationCounts.remove({ _id: `sub-${this._subscriptionId}` });
    });
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
                Meteor.eventBus.emit('books.refresh', null, 'ins');
            });
    },
    'books.delete'(id) {
        console.log('delete')
        fetch(`http://localhost:4000/books/${id}`, {
            method: 'delete',
            //            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                Meteor.eventBus.emit('books.refresh', null, 'del');
            });
    },
    'books.update'({ id, data }) {
        console.log('update')
        fetch('http://localhost:4000/books/' + id, {
            method: 'put',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                Meteor.eventBus.emit('books.refresh', null, 'upd');
            });
    },
});
