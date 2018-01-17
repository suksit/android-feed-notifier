const fs = require('fs')
const parser = require('rss-parser')
const request = require('request')

const tokens = require('./tokens.json')
const oldEntries = require('./entries.json')

const FEED_URL = 'https://feeds.feedburner.com/blogspot/hsDu'
const NOTIFY_URL = 'https://notify-api.line.me/api/notify'

parser.parseURL(FEED_URL, (err, parsed) => {
  if (err) {
    console.error(err)
    return
  }

  fs.writeFileSync('entries.json', JSON.stringify(parsed.feed.entries, null, 2))

  if (oldEntries.length === 0) {
    console.log('saved initial entries')
    return
  }

  const newEntries = parsed.feed.entries.filter((entry) => {
    return oldEntries.filter((oldEntry) => {
      return oldEntry.id === entry.id
    }).length === 0
  })

  console.log(`found ${newEntries.length} new entries`)

  newEntries.forEach((entry) => {
    tokens.forEach((token) => {
      if (token.tags) {
        const found = token.tags.find((tag) => {
          return entry.categories.find((item) => {
            return item._.toLowerCase() === tag.toLowerCase()
          })
        })

        if (!found) {
          console.log(`no matched tags for ${token.name}`)
          return
        }
      }

      const title = entry.title
      const link = entry.link
      const data = {
        url: NOTIFY_URL,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token.value}`
        },
        formData: {
          message: `${title}\r\n${link}`
        }
      }

      console.log(`sending notification to ${token.name}...`)

      request.post(data, (err, res) => {
        if (err) {
          console.error(err)
        }
        console.log(res.body)
      })
    })
  })
})
