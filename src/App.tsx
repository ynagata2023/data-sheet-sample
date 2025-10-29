import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { type Column, DataSheetGrid, type DataSheetGridRef, intColumn, keyColumn, textColumn } from "react-datasheet-grid";
import type { Operation } from "react-datasheet-grid/dist/types";
import z, { ZodError, ZodObject } from "zod";

type RowBase = {
  id: number | null;
  targetId: number | null;
  name: string | null;
  dynamicValue: string | null;
  dynamicValue2: string | null;
}

type ColumnsForTargetId = {
  targetId: number;
  columns: SheetColumn[];
}

type SheetColumn = {
  key: keyof RowBase;
  title?: string;
  value: ColumnValue;
}

type ColumnValue = {
  type: 'string' | 'uint' | 'binary' | 'float';
  required: 1 | 0;
  disabled: 1 | 0;
  valueMin?: number;
  valueMax?: number;
  default?: string;
}


// 列情報
const columnData: ColumnsForTargetId[] = [
  {
    targetId: 1,
    columns: [
      { key: "id", title: 'ID', value: { type: "uint", required: 1, disabled: 0, valueMin: 1 } },
      { key: "name", title: '名前', value: { type: "string", required: 1, disabled: 0, default: "default name" } },
      { key: "targetId", title: 'ターゲットID', value: { type: "uint", required: 1, disabled: 0 } },
      { key: "dynamicValue", title: '動的型値', value: { type: "uint", required: 1, disabled: 0, valueMin: 0, valueMax: 9999, default: "1000" } },
      { key: "dynamicValue2", title: '動的型値2', value: { type: "float", required: 1, disabled: 0, valueMin: 0.0, valueMax: 9999.9, default: "1000" } },
    ],
  },
  {
    targetId: 2,
    columns: [
      { key: "id", value: { type: "uint", required: 1, disabled: 0, valueMin: 1 } },
      { key: "name", value: { type: "string", required: 1, disabled: 0, default: "default name" } },
      { key: "targetId", value: { type: "uint", required: 1, disabled: 0 } },
      { key: "dynamicValue", value: { type: "float", required: 1, disabled: 0, valueMin: 0, valueMax: 9999.9, default: "0.0" } },
      { key: "dynamicValue2", value: { type: "float", required: 1, disabled: 0, valueMin: 0.0, valueMax: 9999.9, default: "1000" } },
    ],
  },
  {
    targetId: 3,
    columns: [
      { key: "id", value: { type: "uint", required: 1, disabled: 1, valueMin: 1 } },
      { key: "name", value: { type: "string", required: 1, disabled: 0, default: "default name" } },
      { key: "targetId", value: { type: "uint", required: 1, disabled: 0 } },
      { key: "dynamicValue", value: { type: "string", required: 1, disabled: 0, default: "default string value" } },
      { key: "dynamicValue2", value: { type: "float", required: 1, disabled: 0, valueMin: 0.0, valueMax: 9999.9, default: "1000" } },
    ],
  },
  {
    targetId: 4,
    columns: [
      { key: "id", value: { type: "uint", required: 1, disabled: 1, valueMin: 1 } },
      { key: "name", value: { type: "string", required: 1, disabled: 0, default: "default name" } },
      { key: "targetId", value: { type: "uint", required: 1, disabled: 0 } },
      { key: "dynamicValue", value: { type: "string", required: 1, disabled: 0, default: "default string value" } },
      { key: "dynamicValue2", value: { type: "float", required: 1, disabled: 0, valueMin: 0.0, valueMax: 9999.9, default: "1000" } },
    ],
  },
];

const initialData: RowBase[] = [
  { id: 1, targetId: 1, name: 'uintValue', dynamicValue: '100', dynamicValue2: 'aaa' },
  { id: 2, targetId: 2, name: 'floatValue', dynamicValue: '1.0', dynamicValue2: 'aaa' },
  { id: 3, targetId: 3, name: 'binaryValue', dynamicValue: '1', dynamicValue2: 'aaa' },
  { id: 4, targetId: 4, name: 'stringValue', dynamicValue: 'hoge', dynamicValue2: 'aaa' },
];

const defaultSchema = z.object({
  id: z.number(),
  targetId: z.number(),
  name: z.string(),
  dynamicValue: z.any(),
});

type ColumnTitles = Record<keyof RowBase, string | undefined>;
function App() {
  const gridRef = useRef<DataSheetGridRef>(null);
  const [rows, setRows] = useState<RowBase[]>(initialData);
  const [errors, setErrors] = useState<RowError[]>([]);
  const reset = useCallback(() => { setRows(initialData) }, [])

  const columnsForTargetId = useMemo<Map<string, ColumnValue>>(() => {
    const result: Map<string, ColumnValue> = new Map();

    columnData.forEach(c => {
      c.columns.forEach(col => {
        result.set(`${c.targetId}-${col.key}`, col.value);
      })
    })
    return result;

  }, []);



  const handleOnChange = useCallback((newRows: RowBase[], operations: Operation[]): void => {
    setRows(newRows)
  }, []);


  const columnTitles = useMemo<ColumnTitles>(() => {
    const result: ColumnTitles = {
      id: columnData[0].columns.find(c => c.key === 'id')?.title,
      targetId: columnData[0].columns.find(c => c.key === 'targetId')?.title,
      name: columnData[0].columns.find(c => c.key === 'name')?.title,
      dynamicValue: columnData[0].columns.find(c => c.key === 'dynamicValue')?.title,
      dynamicValue2: columnData[0].columns.find(c => c.key === 'dynamicValue2')?.title
    }
    return result;

  }, [])
  // targetId ごとの Zod スキーマ生成
  const schemasForTargetId = useMemo<Record<number, ZodObject<any>>>(() => {
    const record: Record<number, ZodObject<any>> = {};

    columnData.forEach(cd => {
      const shape: Record<string, any> = {};

      cd.columns.forEach(col => {
        const key = col.key;
        const {
          type,
          required,
          valueMin,
          valueMax,
        } = col.value;

        const label = columnTitles?.[key] ?? key;
        // 共通化: 必須チェックをすべてに追加
        let schema;
        switch (type) {
          case "uint":
          case "float":
            schema = z
              .any()
              .transform(v => (v === "" ? null : v))
              .refine(v => {
                if (v === null) return !required; // 必須ならNG、任意ならOK
                if (isNaN(Number(v))) return false; // 数値チェック

                const num = Number(v);
                const tooSmall = valueMin != null && num < valueMin;
                const tooLarge = valueMax != null && num > valueMax;

                // ✅ 範囲チェックまとめて
                if (tooSmall || tooLarge) return false;
                // ✅ 整数チェック（uintの場合のみ）
                if (type === "uint" && !Number.isInteger(num)) return false;
                return true;
              }, {
                message: (() => {
                  if (required && valueMin == null && valueMax == null)
                    return `${label}: 必須です`;
                  if (valueMin != null && valueMax != null)
                    return `${label}: ${valueMin}〜${valueMax}の範囲で入力してください`;
                  if (valueMin != null)
                    return `${label}: ${valueMin}以上で入力してください`;
                  if (valueMax != null)
                    return `${label}: ${valueMax}以下で入力してください`;
                  return `${label}: 数値で入力してください`;
                })()
              });
            break;


          case "string":
          default:
            schema = z
              .string()
              .refine(v => v !== "", { message: `${label}: 必須です` });
            break;
        }

        // requiredが0ならnull・空文字を許容
        if (required === 0) {
          schema = schema.optional().nullable();
        } else {
          // ✅ required=1のときは空文字をエラーに
          schema = schema.refine(v => v !== null && v !== "", {
            message: `${label}: 必須です`,
          });
        }
        shape[key] = schema;
      });
      record[cd.targetId] = z.object(shape);
    });

    return record;
  }, [columnTitles]);

  const validateRows = useCallback(
    (rows: RowBase[]) => {
      const newErrors: RowError[] = [];

      rows.forEach((row, index) => {
        const schema = schemasForTargetId[row.targetId ?? -1] ?? defaultSchema;
        try {
          schema.parse(row);
        } catch (e: unknown) {
          if (e instanceof ZodError) {
            // issues 配列を使ってメッセージを整形
            const messages = e.issues.map(issue => {
              const path = issue.path.join(".");
              return `${issue.message}`;
            });

            // 対応する行のエラーオブジェクトを探す
            let rowError = newErrors.find(err => err.row === index);
            if (!rowError) {
              rowError = { row: index + 1, message: "" };
              newErrors.push(rowError);
            }

            // メッセージを追加
            rowError.message += (rowError.message ? " | " : "") + messages.join(", ");
          } else {
            console.error("Unexpected error during validation:", e);
          }
        }
      });

      setErrors(newErrors);
    },
    [schemasForTargetId]
  );
  const columns = useMemo<Column<RowBase>[]>(() => [
    {
      ...keyColumn<RowBase, 'id'>('id', intColumn), title: columnTitles?.id,
      disabled: ({ rowData }) => {
        return rowData.targetId !== null
          ? columnsForTargetId.get(`${rowData.targetId}-id`)?.disabled === 1
          : false
      },
    },
    {
      ...keyColumn<RowBase, 'name'>('name', textColumn), title: columnTitles?.name,
      disabled: ({ rowData }) => {
        return rowData.targetId !== null
          ? columnsForTargetId.get(`${rowData.targetId}-id`)?.disabled === 1
          : false
      },
    },
    {
      ...keyColumn<RowBase, 'targetId'>('targetId', intColumn), title: columnTitles?.targetId,
      disabled: ({ rowData }) => {
        return rowData.targetId !== null
          ? columnsForTargetId.get(`${rowData.targetId}-targetId`)?.disabled === 1
          : false
      },
    },
    {
      ...keyColumn<RowBase, 'dynamicValue'>('dynamicValue', textColumn), title: columnTitles?.dynamicValue,
      disabled: ({ rowData }) => {
        return rowData.targetId !== null
          ? columnsForTargetId.get(`${rowData.targetId}-dynamicValue`)?.disabled === 1
          : false
      },
    },
    {
      ...keyColumn<RowBase, 'dynamicValue2'>('dynamicValue2', textColumn), title: columnTitles?.dynamicValue2,
      disabled: ({ rowData }) => {
        return rowData.targetId !== null
          ? columnsForTargetId.get(`${rowData.targetId}-dynamicValue2`)?.disabled === 1
          : false
      },
    },
  ], [columnTitles, columnsForTargetId])

  function handleCreateRow(): RowBase {
    const newRow: RowBase = {
      id: null,
      targetId: null,
      name: null,
      dynamicValue: null,
      dynamicValue2: null
    }
    return newRow;
  }

  useEffect(() => {
    validateRows(rows);
  }, [rows, validateRows])

  return (
    <div>
      <ErrorTable errors={errors} />
      <div style={{ padding: '4px 0px' }}>ターゲットIDを切り替えると、各カラムの入力制限が切り替わります。</div>
      <div style={{ padding: "8px", }}>
        <button
          onClick={reset}
          style={{
            backgroundColor: "#fff",
            color: "#333",
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "6px 12px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
        >
          リセット
        </button>
      </div>

      <DataSheetGrid
        ref={gridRef}
        value={rows}
        onChange={handleOnChange}
        columns={columns}
        createRow={handleCreateRow}
      />
    </div>
  )
}

export default App

type RowError = { row: number; message: string };

const ErrorTable = ({ errors }: { errors: RowError[] }) => {

  return (
    <table style={{ marginBottom: 16, width: "100%", textAlign: "left", }}>
      <thead>
        <tr>
          <th>行番号</th>
          <th>エラーメッセージ</th>
        </tr>
      </thead>
      <tbody>
        {errors.map((e) => (
          <tr key={e.row}>
            <td>{e.row}</td>
            <td>{e.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}