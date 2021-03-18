import EventBus from 'js-event-bus';

const eventBus = new EventBus();
Meteor.publish('books.all', function () {
    let startsCount = 0;
    let isPublishStop = false;

    let items = {};

    const getBooks = async (isRecursive = true) => {
        try {
            if (isPublishStop) {
                return;
            }
            const response = await fetch('http://localhost:4000/books?page=1&per_page=5000');
            if (response.status == 502) {
                await getBooks();
            } else if (response.status != 200) {
                console.log(response.statusText);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await getBooks();
            } else {
                console.log('Timer: refreshing data');
                console.log(items);
                const cItems = Object.assign({}, items);
                const data = await response.json();
                data.items.forEach((each) => {
                    const id = each.id;
                    delete cItems[id];
                    if (items[id] == null) {
                        items[id] = each;
                        this.added('books', id, each);
                    } else {
                        items[id] = each;
                        this.changed('books', id, each);
                    }
                });
                for (let each in cItems) {
                    console.log('cItems', each);
                    const id = each.id;
                    this.removed('books', id);
                }
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
    eventBus.on('books.create', eventCallback);
    eventBus.on('books.update', eventCallback);
    eventBus.on('books.delete', eventCallback);

    this.onStop(() => {
        isPublishStop = true;
        console.log('on publications stopped');
        eventBus.detach('books.create', eventCallback);
        eventBus.detach('books.update', eventCallback);
        eventBus.detach('books.delete', eventCallback);
    });
});

Meteor.methods({
    'books.create'(data) {
        console.log(data);
        fetch('http://localhost:4000/books', {
            method: 'post',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                eventBus.emit('books.create');
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
                eventBus.emit('books.update', json);
            });
    },
    'books.delete'(id) {
        fetch('http://localhost:4000/books/' + id, {
            method: 'delete',
            body: JSON.stringify({ id }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                eventBus.emit('books.delete', json);
            });
    },
});
