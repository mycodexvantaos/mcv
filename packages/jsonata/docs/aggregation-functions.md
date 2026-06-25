---
id: aggregation-functions
title: Numeric aggregation functions
sidebar_label: Aggregation Functions
---

## `$sum()`

**Signature:** `$sum(array)`

Returns the arithmetic sum of an array of numbers. It is an error if the input array contains an item which isn't a number.

**Example**

- `$sum([5,1,3,7,4])` => `20`

## `$max()`

**Signature:** `$max(array)`

Returns the maximum number in an array of numbers. It is an error if the input array contains an item which isn't a number.

**Example**

- `$max([5,1,3,7,4])` => `7`

## `$min()`

**Signature:** `$min(array)`

Returns the minimum number in an array of numbers. It is an error if the input array contains an item which isn't a number.

**Example**

- `$min([5,1,3,7,4])` => `1`

## `$average()`

**Signature:** `$average(array)`

Returns the mean value of an array of numbers. It is an error if the input array contains an item which isn't a number.

**Example**

- `$average([5,1,3,7,4])` => `4`
