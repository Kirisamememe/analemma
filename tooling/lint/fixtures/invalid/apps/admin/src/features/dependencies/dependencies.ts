import { safe } from "@orpc/client";
import type { ParseKeysWithoutVariables } from "i18next";
import { useState } from "react";
import { createPortal } from "react-dom";

/** 失敗と訳のキーと React の状態。 */
export const dependencies = [safe, useState, createPortal];
/** 引数を取らない訳のキー。 */
export type NoticeKey = ParseKeysWithoutVariables;
