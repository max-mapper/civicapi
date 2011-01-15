function (doc) {
  if (doc._attachments) {
    for (i in doc._attachments) {
      var attachment = doc._attachments[i];
      if (attachment.content_type == 'audio/mp3') {
        if (doc.pubDateTime) {
          var pubdatetime = doc.pubDateTime.replace(' ','T');
        } else {
          var pubdatetime = null;
        }
        emit(pubdatetime, doc);
      }
    }
  }
}