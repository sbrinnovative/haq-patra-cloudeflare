# Haq Patra contact data

Checked on 16 Oct 2026. Every value came from an official page that was opened on that date (the regulator, the Council for Insurance Ombudsmen, or the insurer's or bank's own site). Each record has `source_url`/`sources` and `checked`. If a value could not be read from an official page, it is `null` or an empty list. Nothing was filled from aggregator sites (paisabazaar, bankbazaar, complainthub and similar).

## Files

### ombudsman_offices.json (18 of 18 offices)
All 18 Insurance Ombudsman offices: address, PIN, phones, email (`oio.<city>@cioins.co.in`, Kochi is `oio.ernakulam`), Ombudsman name, and jurisdiction as `states_uts`, plus `partial` (district lists) and `exclusions`. Also covers the online complaint URL, status-tracking URL, specimen form and Council head office.

- Source: https://www.cioins.co.in/ombudsman (site footer: "Last Updated on: 10th July 2026").
- Caveat: that page holds two unlabelled listings. The first one, directly under the heading, is used here. The second looks older (for example, Chandigarh at Batra Building, Sector 17-D). Each office has an `alt_listing_differences` note.
- District matching: the Lucknow and Noida UP district lists use old spellings and old names (Allahabad, Faizabad, Kanshiramnagar and others). Before matching, map them to current district names. A few UP districts appear on neither list (for example Bhadohi). For those, show both offices or ask the user.
- Mumbai, Thane and Pune split by ward. Ward PDFs are linked in the file.

### insurers_gro.json (30 insurers)
Covers 7 standalone health insurers (Star, Care, Niva Bupa, Aditya Birla, ManipalCigna, Galaxy, Narayana), 4 public-sector general insurers and 19 private general insurers.

- `gro.*` comes from the Council's GRO list: https://cioins.co.in/GRONonLife (35 non-life insurers). It gives the GRO name, a personal email and a GRO mailbox, and covers all 30 insurers.
- Toll-free numbers, first-level emails, senior-citizen channels and the escalation ladder come from each insurer's own grievance page, where it could be read.
- Gaps (only the CIO GRO data is verified): Navi (robots block), United India (JS site), Oriental and National (toll-free comes only from IRDAI's older GRO list), Generali Central (only a customer care email and an 1860 number from the homepage). Zurich Kotak's displayed toll-free number contradicts its dial link, so it was not recorded.
- Conflicts flagged in `notes`: GRO names differ between the insurer's page and the CIO list for Chola MS and Narayana. ManipalCigna, IFFCO-Tokio and New India publish GRO emails that differ from the CIO list.
- Renames: Reliance General is now IndusInd General Insurance, Future Generali is now Generali Central, Bajaj Allianz is now Bajaj General and Kotak General is now Zurich Kotak. Old names are kept in `aliases`.
- IRDAI's list (https://policyholder.gov.in/web/guest/list-of-gros) is outdated (it still shows Max Bupa and Bharti AXA). It was used only to corroborate.

### banks_pno.json (32 banks + 3 UPI apps)
- A PNO name or email was found for 21 of the 32 banks (20 have an email).
- No PNO verified: HDFC Bank (JS page), Kotak (only a notices nodal officer is published), Bank of Baroda (only zonal officers), Union Bank (PNO tab did not render), Bank of India, Central Bank, Yes Bank (JS only), IOB.
- Partial: Canara gives the officer as "Nodal Grievance Officer" with no email. Axis and Airtel Payments Bank emails are images or obfuscated. South Indian Bank escalates by web form only. SBI gives the PNO email and phone but no name, and its online complaint portal was not verified.
- Paytm Payments Bank: `status: in_liquidation`. RBI cancelled its licence on 24 Apr 2026, and the Delhi High Court appointed an Official Liquidator in July 2026. No liquidator contact has been published. The PNO record is from before liquidation and is kept only for reference.
- UPI apps:
  - PhonePe: full ladder, but emails are obfuscated.
  - Google Pay: full ladder, using web forms.
  - Paytm: only help URLs could be verified.
- Domains: banks now use `.bank.in`, but many still publish emails on their old domains. These are recorded exactly as published.

### other_contacts.json (7 entries)
Covers Bima Bharosa (portal, complaints@irdai.gov.in, 155255 and 1800 4254 732, postal address), the Insurance Ombudsman online complaint route, RBI CMS under RB-IOS 2026, 1930 and cybercrime.gov.in, NPCI's UPI dispute page, the National Consumer Helpline (1915, WhatsApp +91 8800001915) and e-Jagriti.

- RB-IOS 2026 (in force from 1 Jul 2026): CRPC, 4th Floor, Reserve Bank of India, Sector-17, Central Vista, Chandigarh - 160017; crpc@rbi.org.in; 14448. The filing limit is 90 days after the 30-day reply window, under clause 10(1)(g).
- rbidocs.rbi.org.in shows a human-verification page to fetchers. The scheme text was read from a verbatim copy hosted by a bank, and the RBI press release confirms the PDF link. Recheck it by hand in a browser.
- NPCI publishes no email, phone or form on its readable page.

## Machine-readable sources for a monthly refresh job

| Source | What it gives | Update signal |
|---|---|---|
| https://www.cioins.co.in/ombudsman | 18 offices, addresses, phones, emails, jurisdiction | Footer "Last Updated on" on cioins.co.in (10 Jul 2026). Officer names change with appointments, often several times a year. |
| https://cioins.co.in/GRONonLife | GRO name and emails for 35 non-life insurers in one HTML table | No date on the page. Diff it monthly. This is the single best source to recheck automatically. |
| https://www.cioins.co.in/notification/Mumbai jurisdiction- Annexure B.pdf and .../Thane jurisdiction -Annexure A.pdf | Ward lists | Rarely change |
| https://bimabharosa.irdai.gov.in/Home/ContactUs | IRDAI email, toll-free numbers, postal address | Stable |
| https://www.rbi.org.in/Scripts/Complaints.aspx and RBI press releases | CMS URL, CRPC email, scheme changes | Watch the press releases for scheme amendments |
| Bank PDFs: IndusInd grievance-redressal-mechanism.pdf, IDFC FIRST List-of-escalation-matrix-with-TAT-v2-2.pdf, RBL grievance-redressal-escalation-matrix.pdf, J&K Bank "Address of Nodal Officers" PDF (dated in its file name) | PNO and escalation contacts | The version or date sits in the file name. When the URL changes, a new version has been published. |
| Insurer PDF: Aditya Birla Health GrievanceRedressalPolicy_New.pdf | Escalation emails | Revision table inside the PDF (v1.8, 25 Oct 2024) |
| Static HTML bank pages that fetch cleanly: PNB Lodge-Complaint, Indian Bank nodal-officers, UCO GRO, Federal, Bandhan, CUB, KVB, PSB, IPPB, Bank of Maharashtra nodal page | PNO | No dates. Use hash diffs. PNOs at public-sector banks change on GM transfers, often each April to July. |

Pages that block or defeat automated fetching and need a manual or browser check: Aditya Birla Health HTML, National Insurance, Navi, Bajaj General grievance HTML (the customer-service page works), HDFC Bank, Yes Bank, Paytm, cms.rbi.org.in, cybercrime.gov.in, rbidocs.rbi.org.in, e-jagriti.gov.in, United India, Oriental, and Cloudflare-obfuscated emails (Kotak, Airtel PB, PhonePe, Acko).

Suggested cadence: run monthly on all sources. Watch especially:
- cioins pages, where Ombudsman and GRO names change several times a year.
- Public-sector bank PNO pages after mid-year transfer season.
- RBI press releases for RB-IOS amendments and the 1 Jan 2027 fraud-liability change.
