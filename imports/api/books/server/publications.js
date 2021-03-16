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
                delete(each.id);
                items[id] = each;
                this.added('books', id, each);
            });
            this.ready();
        });

    Meteor.setInterval(() => {
        fetch('http://localhost:4000/books')
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                console.log('refreshing data');
                json.forEach((each) => {
                    const id = each.id;
                    delete(each.id);
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
    }, 1000)







})