---
title: How to handle dates in a web application
date: 2025-01-16
tags:
- C#
- javascript
- webapp
- postgres
- shenanigans
author: Mitchell Caisse
---


Recently I was working on a bug where a datetime for a field in our database would sometimes have time associated with it
and other times it would not, depending on which machine submitted the form. 

To set the stage, I was working on an application
that allows users to set up events that other users can register for. One of the fields is the `registrationEndDate`, essentially
the date at which users can no longer register for the event. Since these events are open to anyone from all over the world, we want to be fair
and have registration close at a specific time, we opted for midnight at UTC. Which means that when I am creating the event, 
if I set the registration end date to `2025-01-16`, then we would record the end date as `2025-01-16 00:00:00+0000`.

When I tested this on my computer, it saved the timestamp properly (`2025-01-16 00:00:00`). As I couldn't replicate it, I
asked another developer to take a look. They tried selecting a date of `2025-03-10`
which saved to their database as `2025-03-10 01:00:00`. Interesting, it added an extra hour, which they were in MST, if
it was going to be different I would have expected it to be off by 2 hours.

They tried one more date, `2025-01-20`, which saved to their database as `2025-01-20 02:00:00`. Which is two hours off, that makes more sense.
It made me remember that daylight savings time begins in March, the 9th this year, hence the date after that being set to `01:00:00`.

With this newfound knowledge I searched through the code looking for the culprit, hoping it wasn't as simple as I had hypthoesized,
I wasn't that lucky.

```javascript
const dateAtMidnightUtc = new Date(eventDate);
dateAtMidnightUtc.setHours(eventDate.getHours() - 5);
```

We were manually accounting for the EST offset by subtracting 5 from the hours. Which means that this code would only work
for places that were 5 hours behind UTC, which in the United States means it would work for the east coast from roughly the beginning of
November to the beginning of March, and central US from the beginning of March to the beginning of November.

I fixed it with the following:
```javascript
const dateAtMidnightUtc = new Date(Date.UTC(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
));
```

Explicitly creating a UTC date from the year, month, and day the user chose, leaving the time blank to default it to midnight. But
that had me wondering is there a better way to handle this?

Tom Scott Timezones: https://www.youtube.com/watch?v=-5wpm-gesOY