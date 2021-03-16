import './books-index.html';
import {Books} from '../../../api/books/books';

Template.Books.onCreated(function(){
    this.subscribe('books.all');
})

Template.Books.helpers({
    books(){
        return Books.find();
    }
})