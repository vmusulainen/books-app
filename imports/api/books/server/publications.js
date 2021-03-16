import EventBus from 'js-event-bus';

const eventBus = EventBus();


Meteor.publish('books.all', function () {
    const items = {};
    //the first adding all fetched items to local store
    fetch('http://localhost:4000/books')
        .then((res) => {
            return res.json();
        })
        .then((json) => {
            json.forEach((each) => {
                const id = each.id;
                delete (each.id);
                items[id] = each;
                this.added('books', id, each);
            });
            this.ready();
        });


    const timeInterval = Meteor.setInterval(() => {
        fetch('http://localhost:4000/books')
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                console.log('Timer: refreshing data');
                json.forEach((each) => {
                    const id = each.id;
                    delete (each.id);
                    if (items[id] == null) {
                        items[id] = each;
                        this.added('books', id, each);
                    } else {
                        items[id] = each;
                        this.changed('books', id, each);
                    }
                });
                this.ready();
            });
    }, 10000);

    eventBus.on('books.create', () => {
        console.log('Forced: refreshing data');
        fetch('http://localhost:4000/books')
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                json.forEach((each) => {
                    const id = each.id;
                    delete (each.id);
                    if (items[id] == null) {
                        items[id] = each;
                        this.added('books', id, each);
                    } else {
                        items[id] = each;
                        this.changed('books', id, each);
                    }
                });
            });




    });


    eventBus.on('books.create', () => {
        console.log('empty event handler')
    });


    this.onStop(() => {
        eventBus.die('books.create');
        Meteor.clearInterval(timeInterval);
    })


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






















