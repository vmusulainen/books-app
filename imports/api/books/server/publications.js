import EventBus from 'js-event-bus';

const eventBus = new EventBus();

// const getEndpoint = (endpoint) => 'http://localhost:4000/' + endpoint;
// const fetchBox = function (endpoint) {
//     return fetch(getEndpoint(endpoint)).then((res) => {
//         return res.json();
//     });
// };
// const mergeBox = function (data, items, collection, publish) {
//     const emptyItems = data.filter((el) => el.id == null);

//     emptyItems.forEach((each) => {
//         const id = each.id;
//         items.id = each;
//         publish.added(collection, id, each);
//     });

//     const fillItems = data.filter((el) => el.id != null);
//     fillItems.forEach((each) => {
//         const id = each.id;
//         items.id = each;
//         publish.changed(collection, id, each);
//     });
// };

Meteor.publish('books.all', function () {
    let startsCount = 0;
    let isPublishStop = false;

    let items = {};

    const getBooks = async (isRecursive = true) => {
        try {
            if (isPublishStop) {
                return;
            }
            const response = await fetch('http://localhost:4000/books');
            if (response.status == 502) {
                await getBooks();
            } else if (response.status != 200) {
                console.log(response.statusText);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await getBooks();
            } else {
                console.log('Timer: refreshing data');
                const json = await response.json();
                json.forEach((each) => {
                    const id = each.id;
                    // delete each.id;
                    if (items[id] == null) {
                        items[id] = each;
                        this.added('books', id, each);
                    } else {
                        items[id] = each;
                        this.changed('books', id, each);
                    }
                });
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
    this.onStop(() => {
        isPublishStop = true;
        console.log('on publications stopped');
        eventBus.detach('books.create', eventCallback);
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
                eventBus.emit('books.create');
            });
    },
});

// Meteor.publish('books.all.test', function () {
//     const items = {};
//     //the first adding all fetched items to local store
//     fetch('http://localhost:4000/books')
//         .then((res) => {
//             return res.json();
//         })
//         .then((json) => {
//             json.forEach((each) => {
//                 const id = each.id;
//                 delete each.id;
//                 items[id] = each;
//                 this.added('books', id, each);
//             });
//             this.ready();
//         });
//     const timeInterval = Meteor.setInterval(() => {
//         fetch('http://localhost:4000/books')
//             .then((res) => {
//                 return res.json();
//             })
//             .then((json) => {
//                 console.log('Timer: refreshing data');
//                 json.forEach((each) => {
//                     const id = each.id;
//                     delete each.id;
//                     if (items[id] == null) {
//                         items[id] = each;
//                         this.added('books', id, each);
//                     } else {
//                         items[id] = each;
//                         this.changed('books', id, each);
//                     }
//                 });
//                 this.ready();
//             });
//     }, 10000);

//     const eventCallback = () => {
//         console.log('event callback');
//         fetch('http://localhost:4000/books')
//             .then((res) => {
//                 return res.json();
//             })
//             .then((json) => {
//                 json.forEach((each) => {
//                     const id = each.id;
//                     delete each.id;
//                     if (items[id] == null) {
//                         items[id] = each;
//                         this.added('books', id, each);
//                     } else {
//                         items[id] = each;
//                         this.changed('books', id, each);
//                     }
//                 });
//             });
//     };

//     eventBus.on('books.create', eventCallback);

//     this.onStop(() => {
//         console.log('on publications stopped');
//         eventBus.detach('books.create', eventCallback);
//         Meteor.clearInterval(timeInterval);
//     });
// });
