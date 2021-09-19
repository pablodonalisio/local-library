var BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");
const book = require("../models/book");
const async = require("async");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) return next(err);
      if (bookinstance == null) {
        const err = new Error("Bookinstance not found");
        err.status = 404;
      }
      res.render("bookinstance_detail", {
        title: "Copy: " + bookinstance.book.title,
        bookinstance: bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, "title").exec(function (err, books) {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec((err, books) => {
        if (err) return next(err);
        res.render("book_form", {
          title: "Create Bookinstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });
      return;
    } else {
      bookinstance.save((err) => {
        if (err) return next(err);
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) return next(err);
      if (bookinstance === null) {
        res.redirect("/catalog/bookinstances");
      }
      res.render("bookinstance_delete", {
        title: "Delete Book Instance",
        bookinstance: bookinstance,
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
  BookInstance.findByIdAndRemove(req.body.bookinstanceid).exec((err) => {
    if (err) return next(err);

    res.redirect("/catalog/bookinstances");
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  async.parallel(
    {
      book_list: (callback) => {
        Book.find({}, "title").exec(callback);
      },
      bookinstance: (callback) => {
        BookInstance.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) return next(err);

      res.render("bookinstance_form", {
        title: "Update book instance",
        bookinstance: results.bookinstance,
        book_list: results.book_list,
        selected_book: results.bookinstance.book._id,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec((err, books) => {
        if (err) return next(err);
        res.render("book_form", {
          title: "Create Bookinstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });
      return;
    } else {
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        (err, bookinstance) => {
          if (err) return next(err);
          res.redirect(bookinstance.url);
        }
      );
    }
  },
];