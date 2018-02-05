# Crawler to Spreadsheet

This crawler takes last crawler run result and stores new items in Google Docs Spreadsheet.
New items are identified based on md5 hash of that record. It's invoked as finish webhook
of crawler.

------------------------------------------------------------------------------------

## Setup instructions

### Step 1 - Create a crawler

- Set Run Act Webhook of this act as Finish Webhook URL of this crawler. This webhook
  is in form `https://api.apify.com/v2/acts/mtrunkat~crawler-to-spreadsheet/runs?token=[YOUR_API_TOKEN]`

### Step 2 - Google credentions configuration

- Go to the Google Developers Console
- Select your project or create a new one (and then select it)

#### Enable the Google Drive API for your project

- In the sidebar on the left, expand APIs & auth > APIs
- Search for "drive"
- Click on "Drive API"
- click the blue "Enable API" button

#### Create a service account for your project

- In the sidebar on the left, expand APIs & auth > Credentials
- Click blue "Add credentials" button
- Select the "Service account" option
- Select the "JSON" key type option
- Click blue "Create" button
  and your JSON key file is generated and downloaded to your machine (it is the only copy!)
  note your service account's email address (also available in the JSON key file)
- Share the doc (or docs) with your service account using the email noted above

### Step 3 - Google spreadsheet configuration

- This spreadsheet needs to be shared with Google API account created above.
- The first row of the spreadsheet must contain column names. These names must be 
  the same as result fields of the crawler's page function and also must contain 
  "hash" column which will be used to identify new items.
- Spreadsheet should not contain empty lines because the first empty line is used
  by 'google-spreadsheet' package to indicate the end of the document.

### Step 4 - Configure Finish Webhook data of your crawler to be a JSON with following fields

|Option|Type|Description|
-------|----|-----------|
|`googleCredentialsEmail`|String|From step 2|
|`googleCredentialsPrivateKey`|Array|Key that you obtain in step 2 with new lines replaced by `\n`|
|`spreadsheetKey`|String|You can find this in spreadsheet url|
|`spreadsheetPage`|Number|Most likely = 0|

so it will looks something like:

```json
{
    "googleCredentialsEmail": "9898798666-compute@developer.gserviceaccount.com",
    "googleCredentialsPrivateKey": "firstline\nsecondline\nthirdline\n====",
    "spreadsheetKey": "1tu7V4FsoYCpkCvQPByHTWOdFQ9bs_zag9suDwrLg20w",
    "spreadsheetPage": 0
}
```


