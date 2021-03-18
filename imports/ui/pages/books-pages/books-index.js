import './books-index.html';
import { Books } from '../../../api/books/books';

Template.Books.onCreated(function () {
    this.subscribe('books.all');
});

Template.Books.helpers({
    books() {
        return Books.find({}, { sort: { _id: -1 } });
    },
    now() {
        return new Date().getTime();
    },
});

Template.Books.events({
    submit(event, template) {
        event.preventDefault();

        const form = event.currentTarget;
        const id = form.getAttribute('data-id');
        const type = form.name;

        let author, title, data;
        switch (type) {
            case 'create':
                author = form.author.value;
                title = form.title.value;
                if (!author && !title) {
                    return;
                }
                data = { author, title };
                Meteor.call('books.create', data, (err, res) => {
                    if (err) {
                        console.log('err', err);
                    }
                });
                break;
            case 'edit':
                author = form.author.value;
                title = form.title.value;
                if (!author && !title) {
                    return;
                }
                data = { author, title };
                Meteor.call('books.update', { id, data }, (err, res) => {
                    if (err) {
                        console.log('err', err);
                    }
                });
                break;
            case 'delete':
                Meteor.call('books.delete', id, (err, res) => {
                    if (err) {
                        console.log('err', err);
                    }
                });
                break;
        }
    },
});
