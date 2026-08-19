/*************************************************
 * APPLICANT LETTER EMAIL AUTOMATION
 *
 * STATUS / TEMPLATE TABLE
 * B3 = Shortlisted
 * B4 = For Interview
 * B5 = Not Selected
 * B6 = Under Review
 *
 * C3:C6 = Google Docs link OR Google Docs smart chip
 *
 * INTERVIEW
 * D3 = Interview Date
 * E3 = Interview Time
 *
 * APPLICANTS START ROW 9
 * A = Name
 * B = Email Address
 * C = Position Applied For
 * D = Status
 * E = Send Checkbox
 * F = Remarks
 *************************************************/

const START_ROW = 9;

const COL_NAME = 1;       // A
const COL_EMAIL = 2;      // B
const COL_POSITION = 3;   // C
const COL_STATUS = 4;     // D
const COL_SEND = 5;       // E
const COL_REMARKS = 6;    // F


/*************************************************
 * INSTALLABLE ON EDIT TRIGGER
 *************************************************/
function sendApplicantLetterOnEdit(e) {

  if (!e || !e.range) return;

  const range = e.range;
  const sheet = range.getSheet();

  const row = range.getRow();
  const column = range.getColumn();

  // Only checkbox column E, starting Row 9
  if (row < START_ROW) return;
  if (column !== COL_SEND) return;

  // Only when checkbox becomes TRUE
  if (String(e.value).toUpperCase() !== "TRUE") return;

  sendApplicantLetter_(sheet, row);
}


/*************************************************
 * MAIN EMAIL FUNCTION
 *************************************************/
function sendApplicantLetter_(sheet, row) {

  const remarksCell =
    sheet.getRange(row, COL_REMARKS);

  let tempFile = null;

  try {

    remarksCell
      .setValue("PROCESSING...")
      .setBackground("#fef3c7")
      .setFontColor("#92400e");

    SpreadsheetApp.flush();


    /*********************************************
     * GET APPLICANT INFORMATION
     *********************************************/
    const name =
      String(
        sheet.getRange(row, COL_NAME)
          .getDisplayValue()
      ).trim();

    const email =
      String(
        sheet.getRange(row, COL_EMAIL)
          .getDisplayValue()
      ).trim();

    const position =
      String(
        sheet.getRange(row, COL_POSITION)
          .getDisplayValue()
      ).trim();

    const status =
      String(
        sheet.getRange(row, COL_STATUS)
          .getDisplayValue()
      ).trim();


    /*********************************************
     * VALIDATION
     *********************************************/
    if (!name) {
      throw new Error(
        "Applicant Name is missing."
      );
    }

    if (!email) {
      throw new Error(
        "Email Address is missing."
      );
    }

    if (!isValidEmail_(email)) {
      throw new Error(
        "Invalid email address."
      );
    }

    if (!position) {
      throw new Error(
        "Position Applied For is missing."
      );
    }

    if (!status) {
      throw new Error(
        "Application Status is missing."
      );
    }


    /*********************************************
     * FIND TEMPLATE BASED ON STATUS
     *
     * B3:B6 = Status
     * C3:C6 = Link / Smart Chip
     *********************************************/
    const templateInfo =
      getTemplateForStatus_(
        sheet,
        status
      );


    if (!templateInfo) {
      throw new Error(
        'No template found for Status "' +
        status +
        '".'
      );
    }


    const templateUrl =
      templateInfo.url;


    if (!templateUrl) {
      throw new Error(
        'The Google Docs link for "' +
        status +
        '" could not be read.'
      );
    }


    /*********************************************
     * EXTRACT GOOGLE FILE ID
     *********************************************/
    const templateId =
      extractGoogleFileId_(
        templateUrl
      );


    if (!templateId) {
      throw new Error(
        "Unable to get the Google Docs File ID."
      );
    }


    /*********************************************
     * CHECK GOOGLE DOC
     *********************************************/
    let templateFile;

    try {

      templateFile =
        DriveApp.getFileById(
          templateId
        );

    } catch (error) {

      throw new Error(
        "Google Docs template cannot be accessed. " +
        "Please check the link and sharing permission."
      );
    }


    /*********************************************
     * INTERVIEW DATE AND TIME
     *********************************************/
    const interviewDate =
      String(
        sheet.getRange("D3")
          .getDisplayValue()
      ).trim();

    const interviewTime =
      String(
        sheet.getRange("E3")
          .getDisplayValue()
      ).trim();


    if (
      status.toLowerCase() ===
      "for interview"
    ) {

      if (!interviewDate) {
        throw new Error(
          "Interview Date in D3 is missing."
        );
      }

      if (!interviewTime) {
        throw new Error(
          "Interview Time in E3 is missing."
        );
      }
    }


    /*********************************************
     * CREATE PERSONALIZED COPY
     *********************************************/
    const temporaryFileName =
      "Application Letter - " +
      name +
      " - " +
      status;


    tempFile =
      templateFile.makeCopy(
        temporaryFileName
      );


    /*********************************************
     * OPEN GOOGLE DOC COPY
     *********************************************/
    const doc =
      DocumentApp.openById(
        tempFile.getId()
      );


    const body =
      doc.getBody();


    /*********************************************
     * REPLACE PLACEHOLDERS
     *********************************************/
    replacePlaceholder_(
      body,
      "{{NAME}}",
      name
    );

    replacePlaceholder_(
      body,
      "{{POSITION}}",
      position
    );

    replacePlaceholder_(
      body,
      "{{STATUS}}",
      status
    );

    replacePlaceholder_(
      body,
      "{{INTERVIEW_DATE}}",
      interviewDate
    );

    replacePlaceholder_(
      body,
      "{{INTERVIEW_TIME}}",
      interviewTime
    );


    doc.saveAndClose();


    /*********************************************
     * WAIT FOR DOC TO SAVE
     *********************************************/
    Utilities.sleep(800);


    /*********************************************
     * CONVERT TO PDF
     *********************************************/
    const pdfFileName =
      "Application Status - " +
      name +
      ".pdf";


    const pdf =
      tempFile
        .getAs(MimeType.PDF)
        .setName(pdfFileName);


    /*********************************************
     * EMAIL SUBJECT
     *********************************************/
    let subject =
      "Application Status Update - " +
      position;


    if (
      status.toLowerCase() ===
      "for interview"
    ) {

      subject =
        "Interview Invitation - " +
        position;
    }

    else if (
      status.toLowerCase() ===
      "shortlisted"
    ) {

      subject =
        "You Have Been Shortlisted - " +
        position;
    }

    else if (
      status.toLowerCase() ===
      "not selected"
    ) {

      subject =
        "Application Status Update - " +
        position;
    }

    else if (
      status.toLowerCase() ===
      "under review"
    ) {

      subject =
        "Your Application is Under Review - " +
        position;
    }


    /*********************************************
     * INTERVIEW INFORMATION FOR EMAIL
     *********************************************/
    let interviewSection = "";


    if (
      status.toLowerCase() ===
      "for interview"
    ) {

      interviewSection = `

        <div style="
          margin:22px 0;
          padding:18px;
          background:#eff6ff;
          border-left:4px solid #2563eb;
          border-radius:8px;
        ">

          <div style="
            font-size:14px;
            font-weight:bold;
            color:#1e3a8a;
            margin-bottom:10px;
          ">
            Interview Schedule
          </div>

          <div style="
            margin-bottom:6px;
          ">
            <strong>Date:</strong>
            ${escapeHtml_(interviewDate)}
          </div>

          <div>
            <strong>Time:</strong>
            ${escapeHtml_(interviewTime)}
          </div>

        </div>
      `;
    }


    /*********************************************
     * EMAIL BODY
     *********************************************/
    const htmlBody = `

      <div style="
        max-width:620px;
        margin:0 auto;
        font-family:Arial,sans-serif;
        color:#334155;
        line-height:1.7;
      ">

        <div style="
          padding:22px 24px;
          background:#0f3d66;
          color:#ffffff;
          border-radius:12px 12px 0 0;
        ">

          <div style="
            font-size:20px;
            font-weight:bold;
          ">
            Application Status Update
          </div>

        </div>


        <div style="
          padding:25px;
          border:1px solid #e2e8f0;
          border-top:0;
          border-radius:0 0 12px 12px;
          background:#ffffff;
        ">

          <p>
            Dear
            <strong>
              ${escapeHtml_(name)}
            </strong>,
          </p>


          <p>
            We would like to provide you
            with an update regarding your
            application.
          </p>


          <table style="
            width:100%;
            border-collapse:collapse;
            margin:22px 0;
          ">

            <tr>

              <td style="
                width:40%;
                padding:11px;
                background:#f8fafc;
                border-bottom:1px solid #e2e8f0;
                color:#64748b;
              ">
                Name
              </td>

              <td style="
                padding:11px;
                border-bottom:1px solid #e2e8f0;
                font-weight:bold;
              ">
                ${escapeHtml_(name)}
              </td>

            </tr>


            <tr>

              <td style="
                padding:11px;
                background:#f8fafc;
                border-bottom:1px solid #e2e8f0;
                color:#64748b;
              ">
                Position Applied For
              </td>

              <td style="
                padding:11px;
                border-bottom:1px solid #e2e8f0;
                font-weight:bold;
              ">
                ${escapeHtml_(position)}
              </td>

            </tr>


            <tr>

              <td style="
                padding:11px;
                background:#f8fafc;
                border-bottom:1px solid #e2e8f0;
                color:#64748b;
              ">
                Status
              </td>

              <td style="
                padding:11px;
                border-bottom:1px solid #e2e8f0;
                font-weight:bold;
              ">
                ${escapeHtml_(status)}
              </td>

            </tr>

          </table>


          ${interviewSection}


          <p>
            Please see the attached
            personalized letter for
            complete details.
          </p>


          <p>
            Thank you for your interest
            in our organization.
          </p>


          <br>


          <p>
            Regards,<br>
            <strong>
              Human Resources Department
            </strong>
          </p>

        </div>

      </div>
    `;


    /*********************************************
     * SEND EMAIL
     *********************************************/
    GmailApp.sendEmail(

      email,

      subject,

      "Please see the attached application status letter.",

      {
        htmlBody: htmlBody,

        attachments: [
          pdf
        ],

        name:
          "Human Resources Department"
      }

    );


    /*********************************************
     * SUCCESS REMARKS
     *********************************************/
    const timestamp =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "dd-MMM-yyyy hh:mm a"
      );


    remarksCell
      .setValue(
        "SENT - " +
        timestamp
      )
      .setBackground(
        "#dcfce7"
      )
      .setFontColor(
        "#15803d"
      );


    SpreadsheetApp.flush();


  } catch (error) {


    /*********************************************
     * ERROR REMARKS
     *********************************************/
    remarksCell
      .setValue(
        "ERROR - " +
        error.message
      )
      .setBackground(
        "#fee2e2"
      )
      .setFontColor(
        "#dc2626"
      );


    SpreadsheetApp.flush();


  } finally {


    /*********************************************
     * DELETE TEMPORARY DOC
     *********************************************/
    if (tempFile) {

      try {

        tempFile.setTrashed(true);

      } catch (error) {

        // Ignore cleanup error

      }

    }

  }

}



/*************************************************
 * FIND TEMPLATE ACCORDING TO STATUS
 *************************************************/
function getTemplateForStatus_(
  sheet,
  applicantStatus
) {

  const statusToFind =
    String(
      applicantStatus || ""
    )
      .trim()
      .toLowerCase();


  for (
    let row = 3;
    row <= 6;
    row++
  ) {


    const status =
      String(
        sheet
          .getRange(row, 2)
          .getDisplayValue()
      )
        .trim()
        .toLowerCase();


    if (
      status !==
      statusToFind
    ) {
      continue;
    }


    /*********************************************
     * Column C
     *********************************************/
    const linkCell =
      sheet.getRange(
        row,
        3
      );


    const url =
      getUrlFromCell_(
        linkCell
      );


    return {

      status:
        status,

      row:
        row,

      url:
        url

    };

  }


  return null;

}



/*************************************************
 * GET URL FROM CELL
 *
 * Supports:
 * 1. Google Docs smart chip
 * 2. Rich-text hyperlink
 * 3. Normal URL
 * 4. HYPERLINK() formula
 * 5. Direct Google File ID
 *************************************************/
function getUrlFromCell_(range) {


  /*********************************************
   * METHOD 1:
   * RICH TEXT / GOOGLE DOCS SMART CHIP
   *********************************************/
  try {

    const richText =
      range.getRichTextValue();


    if (richText) {


      /*******************************************
       * Whole cell hyperlink
       *******************************************/
      const directLink =
        richText.getLinkUrl();


      if (directLink) {

        return directLink;

      }


      /*******************************************
       * Check individual rich-text runs
       *******************************************/
      const runs =
        richText.getRuns();


      if (runs && runs.length) {

        for (
          let i = 0;
          i < runs.length;
          i++
        ) {

          const runLink =
            runs[i].getLinkUrl();


          if (runLink) {

            return runLink;

          }

        }

      }

    }

  } catch (error) {

    // Continue to next method

  }


  /*********************************************
   * METHOD 2:
   * HYPERLINK FORMULA
   *********************************************/
  try {

    const formula =
      String(
        range.getFormula() || ""
      ).trim();


    if (formula) {


      const hyperlinkMatch =
        formula.match(
          /=HYPERLINK\(\s*"([^"]+)"/i
        );


      if (
        hyperlinkMatch &&
        hyperlinkMatch[1]
      ) {

        return hyperlinkMatch[1];

      }

    }

  } catch (error) {

    // Continue

  }


  /*********************************************
   * METHOD 3:
   * PLAIN CELL VALUE
   *********************************************/
  const value =
    String(
      range.getDisplayValue() || ""
    ).trim();


  if (
    /^https?:\/\//i.test(
      value
    )
  ) {

    return value;

  }


  /*********************************************
   * METHOD 4:
   * DIRECT GOOGLE FILE ID
   *********************************************/
  if (
    /^[a-zA-Z0-9_-]{25,}$/
      .test(value)
  ) {

    return value;

  }


  return "";

}



/*************************************************
 * EXTRACT GOOGLE FILE ID
 *************************************************/
function extractGoogleFileId_(
  value
) {

  const text =
    String(
      value || ""
    ).trim();


  if (!text) {
    return "";
  }


  /*********************************************
   * If already file ID
   *********************************************/
  if (
    /^[a-zA-Z0-9_-]{25,}$/
      .test(text)
  ) {

    return text;

  }


  /*********************************************
   * Standard Google Docs / Drive URL
   *********************************************/
  const docMatch =
    text.match(
      /\/d\/([a-zA-Z0-9_-]+)/
    );


  if (
    docMatch &&
    docMatch[1]
  ) {

    return docMatch[1];

  }


  /*********************************************
   * Google Drive file?id=
   *********************************************/
  const idMatch =
    text.match(
      /[?&]id=([a-zA-Z0-9_-]+)/
    );


  if (
    idMatch &&
    idMatch[1]
  ) {

    return idMatch[1];

  }


  /*********************************************
   * Final fallback
   *********************************************/
  const genericMatch =
    text.match(
      /[a-zA-Z0-9_-]{25,}/
    );


  if (
    genericMatch
  ) {

    return genericMatch[0];

  }


  return "";

}



/*************************************************
 * REPLACE GOOGLE DOC PLACEHOLDERS
 *************************************************/
function replacePlaceholder_(
  body,
  placeholder,
  replacement
) {

  const escapedPlaceholder =
    placeholder
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );


  body.replaceText(
    escapedPlaceholder,
    String(
      replacement || ""
    )
  );

}



/*************************************************
 * EMAIL VALIDATION
 *************************************************/
function isValidEmail_(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      String(
        email || ""
      ).trim()
    );

}



/*************************************************
 * HTML ESCAPE
 *************************************************/
function escapeHtml_(
  value
) {

  return String(
    value || ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}



/*************************************************
 * OPTIONAL:
 * CREATE INSTALLABLE ON-EDIT TRIGGER
 *
 * Run this ONCE manually.
 *************************************************/
function createEmailTrigger() {

  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();


  /*********************************************
   * Avoid duplicate trigger
   *********************************************/
  const triggers =
    ScriptApp
      .getProjectTriggers();


  triggers.forEach(
    trigger => {

      if (
        trigger.getHandlerFunction() ===
        "sendApplicantLetterOnEdit"
      ) {

        ScriptApp.deleteTrigger(
          trigger
        );

      }

    }
  );


  /*********************************************
   * Create new trigger
   *********************************************/
  ScriptApp
    .newTrigger(
      "sendApplicantLetterOnEdit"
    )
    .forSpreadsheet(
      spreadsheet
    )
    .onEdit()
    .create();


  SpreadsheetApp
    .getUi()
    .alert(
      "Email automation trigger created successfully."
    );

}



/*************************************************
 * OPTIONAL TEST
 *
 * Change 9 to desired applicant row
 *************************************************/
function testSendApplicantLetter() {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getActiveSheet();


  sendApplicantLetter_(
    sheet,
    9
  );

}