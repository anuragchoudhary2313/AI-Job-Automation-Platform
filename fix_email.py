def callback(commit):
    if commit.author_email == b"anuragchoudhary603@gmail.com":
        commit.author_email = b"anuragchoudhary603@gmail.com"
        commit.author_name = b"Anurag Choudhary"

    if commit.committer_email == b"anuragchoudhary603@gmail.com":
        commit.committer_email = b"anuragchoudhary603@gmail.com"
        commit.committer_name = b"Anurag Choudhary"