import './books-index.html';
import {Books} from '../../../api/books/books';

Template.Books.onCreated(function () {
    this.subscribe('books.all');
})

Template.Books.helpers({
    books() {
        return Books.find({}, {sort: {_id: -1}});
    }
});

Template.Books.events({
    'click [data-action=book-create]'() {
        const author = `Author: ${new Date().valueOf()}`;
        const title = `Title: ${new Date().valueOf()}`;
        Meteor.call('books.create', {author, title}, (err, res) => {
                if (err) {
                    console.log('err', err);
                }
            }
        )
    }
})

