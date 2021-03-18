import './books-index.html';
import {Books} from '../../../api/books/books';
import {PaginationCounts} from '../../../api/pagination-counts/pagination-counts';

Template.Books.onCreated(function () {
    this.subscriptionIdVar = new ReactiveVar();

    this.perPageVar = new ReactiveVar(10);
    this.pageVar = new ReactiveVar(1);

    this.autorun(() => {
        const handler = this.subscribe('books.all', this.pageVar.get(), this.perPageVar.get(), () => {
            const id = `sub-${handler.subscriptionId}`
            this.subscriptionIdVar.set(id);
            this.subscribe('pagination-counts.subscription', id);
        });
    });
})

Template.Books.helpers({
    books() {
        return Books.find({subscriptionId: Template.instance().subscriptionIdVar.get()}, {sort: {_id: 1}});
    },
    pagination() {
        if (Template.instance().subscriptionIdVar.get() == null) {
            return;
        }
        return PaginationCounts.findOne({_id: Template.instance().subscriptionIdVar.get()});
    },
    subscriptionId(){
        return Template.instance().subscriptionIdVar.get();
    }

});

Template.Books.events({
    'click [data-action=book-create]'() {
        const author = `author-${new Date().valueOf()}`;
        const title = `title-${new Date().valueOf()}`;
        Meteor.call('books.create', {author, title}, (err, res) => {
                if (err) {
                    console.log('err', err);
                }
            }
        )
    },
    'click [data-action=book-delete]'() {
        const book = Books.findOne({subscriptionId: Template.instance().subscriptionIdVar.get()}, {sort: {_id: 1}});

        Meteor.call('books.delete', book.id, (err, res) => {
                if (err) {
                    console.log('err', err);
                }
            }
        )
    },
    'click [data-action=next-page]'(event, template) {
        const id = event.currentTarget.getAttribute('data-id');
        if (id !== template.subscriptionIdVar.get()) {
            return;
        }
        const pageCount = PaginationCounts.findOne({_id: template.subscriptionIdVar.get()}).page_count;
        const page = Math.min(pageCount, template.pageVar.get() + 1);
        template.pageVar.set(page);
    },
    'click [data-action=prev-page]'(event, template) {
        const id = event.currentTarget.getAttribute('data-id');
        if (id !== template.subscriptionIdVar.get()) {
            return;
        }
        const page = Math.max(1, template.pageVar.get() - 1);
        template.pageVar.set(page);
    },
    'input #perPage'(event, template) {
        const perPage = parseInt(event.currentTarget.value);
        template.perPageVar.set(perPage);
    }
});

